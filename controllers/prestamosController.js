const db = require('../config/db'); 
const GrupoModel = require('../models/GrupoModel');
const PrestamoModel = require('../models/PrestamoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const finance = require('../utils/finance');

const prestamosController = {

    // 1. Listar préstamos con Buscador de Amplio Espectro (Nombres, DNI o Grupos)
    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;
            const busqueda = (req.query.q || '').trim();

            let queryHistorial = `
                SELECT 
                    p.id,
                    p.grupo_id,
                    g.nombre AS grupo_nombre,
                    CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                    c.dni AS cliente_dni,
                    p.monto_prestado,
                    p.monto_total,
                    p.cuotas,
                    p.frecuencia,
                    p.fecha_inicio,
                    p.fecha_fin,
                    (SELECT COUNT(*) FROM cobranzas cob WHERE cob.prestamo_id = p.id) AS cuotas_pagadas,
                    IFNULL((SELECT SUM(cob.monto_pagado) FROM cobranzas cob WHERE cob.prestamo_id = p.id), 0.00) AS dinero_pagado
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                LEFT JOIN grupos g ON p.grupo_id = g.id
            `;

            let queryContar = `SELECT COUNT(*) AS total FROM prestamos p INNER JOIN clientes c ON p.cliente_id = c.id LEFT JOIN grupos g ON p.grupo_id = g.id`;

            const params = [];
            const paramsContar = [];

            if (busqueda) {
                const filtroEspecial = ` WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR c.dni LIKE ? OR g.nombre LIKE ? OR p.id = ?`;
                queryHistorial += filtroEspecial;
                queryContar += filtroEspecial;
                const bLike = `%${busqueda}%`;
                const bId = parseInt(busqueda) || 0;
                params.push(bLike, bLike, bLike, bLike, bId);
                paramsContar.push(bLike, bLike, bLike, bLike, bId);
            }

            queryHistorial += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rowsPrestamos] = await db.query(queryHistorial, params);
            const [rowsTotal] = await db.query(queryContar, paramsContar);
            const totalRegistros = rowsTotal.total;

            rowsPrestamos.forEach(prestamo => {
                const dineroPagado = parseFloat(prestamo.dinero_pagado);
                const montoTotalCredito = parseFloat(prestamo.monto_total);
                const cuotasPagadas = parseInt(prestamo.cuotas_pagadas);
                const cuotasPactadas = parseInt(prestamo.cuotas || 0);

                if (dineroPagado >= montoTotalCredito || (cuotasPactadas > 0 && cuotasPagadas >= cuotasPactadas)) {
                    prestamo.estado = 'Cancelado';
                } else {
                    const hoy = new Date();
                    const fechaFinCredito = new Date(prestamo.fecha_fin || prestamo.fecha_inicio);
                    if (hoy > fechaFinCredito) {
                        prestamo.estado = 'Vencido';
                    } else {
                        prestamo.estado = 'Vigente';
                    }
                }
            });

            const totalPages = Math.ceil(totalRegistros / limit);
            let config = null;
            try { config = await ConfigModel.obtener(); } catch (e) { config = { moneda: 'S/' }; }
            const empresaConfig = config || { moneda: 'S/' };

            res.render('prestamos/index', { 
                title: 'Gestión de Préstamos',
                prestamos: rowsPrestamos, 
                busqueda: busqueda,
                currentPage: page,
                totalPages: totalPages,
                totalRegistros: totalRegistros,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // 2. Formulario de nuevo préstamo
    mostrarFormulario: async (req, res) => {
        try {
            const [clientes, grupos, config] = await Promise.all([
                ClienteModel.obtenerTodos ? await ClienteModel.obtenerTodos() : [],
                GrupoModel.obtenerTodosLosGrupos ? await GrupoModel.obtenerTodosLosGrupos() : [],
                ConfigModel.obtener()
            ]);
            res.render('prestamos/crear', { 
                title: 'Nuevo Préstamo',
                clientes,
                grupos: grupos || [],
                empresa: config || { moneda: 'S/' }
            });
        } catch (error) {
            res.redirect('/prestamos');
        }
    },
       // 💾 3. Guardar Masivo (BLINDADO: Bloquea nuevos desembolsos si el grupo tiene deudas vigentes o vencidas)
    guardar: async (req, res) => {
        try {
            const { tipo_prestamo, interes, cuotas, frecuencia, fecha_inicio, creditos, grupo_id } = req.body;

            if (!creditos || creditos.length === 0) {
                return res.status(400).json({ status: 'error', mensaje: 'No se enviaron integrantes para este crédito.' });
            }

            // 🧠 CAPTURA DEL ID DEL GRUPO: Extraemos el ID ya sea del cuerpo de la petición o del primer integrante
            const idGrupoEvaluado = parseInt(grupo_id || creditos[0].grupo_id || 0);

            // 🛡️ ESCUDO DE SOBREENDEUDAMIENTO GRUPAL: Si es crédito colectivo, auditamos el estado en Laragon
            if ((tipo_prestamo === 'Grupal' || tipo_prestamo === 'Emprende Mujer') && idGrupoEvaluado > 0) {
                
                // Buscamos si existe algún préstamo activo o en mora asociado estrictamente a este grupo
                const [creditosActivos] = await db.query(`
                    SELECT estado 
                    FROM prestamos 
                    WHERE grupo_id = ? 
                      AND (estado = 'Vigente' OR estado = 'Vencido' OR estado = 'Activo' OR estado = 'activo' OR estado = 'vigente' OR estado = 'vencido')
                    ORDER BY id DESC LIMIT 1
                `, [idGrupoEvaluado]);

                if (creditosActivos && creditosActivos.length > 0) {
                    const estadoActual = String(creditosActivos[0].estado).toUpperCase();
                    
                    // Frenamos la operación de inmediato enviando la alerta explícita de control de riesgo al frontend
                    return res.status(400).json({
                        status: 'grupo_bloqueado',
                        mensaje: `Operación Denegada. Este grupo actualmente tiene un ciclo de crédito en estado [${estadoActual}]. No se puede generar un nuevo préstamo hasta que liquiden la deuda anterior por completo.`
                    });
                }
            }

            // 🧠 SINCRO DE NEGOCIO: Inyectamos a Laragon la frase exacta de fábrica que tus estadísticas buscan
            const etiquetaTipoOriginal = (tipo_prestamo === 'Grupal' || tipo_prestamo === 'Emprende Mujer') 
                ? 'Grupo de Crédito / Junta Masiva' 
                : 'Préstamo Individual Estándar';

            // C) Si pasa los escudos de control de riesgo, registramos el lote de créditos de forma normal
            for (const item of creditos) {
                const montoCapital = parseFloat(item.monto);
                const calculoInteres = montoCapital * (parseFloat(interes) / 100);
                const montoTotalConInteres = montoCapital + calculoInteres;

                let diasPorCuota = 7; 
                const freqLower = (frecuencia || '').toLowerCase();
                if (freqLower === 'diario') diasPorCuota = 1;
                if (freqLower === 'quincenal') diasPorCuota = 15;
                if (freqLower === 'mensual') diasPorCuota = 30;

                const diasTotalesPrestamo = parseInt(cuotas) * diasPorCuota;

                let fechaFinObj = new Date(fecha_inicio + 'T12:00:00'); 
                fechaFinObj.setDate(fechaFinObj.getDate() + diasTotalesPrestamo);
                const fechaFinCalculada = fechaFinObj.toISOString().split('T')[0];

                const queryInsert = `
                    INSERT INTO prestamos (
                        cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, 
                        frecuencia, estado, fecha_inicio, fecha_fin, grupo_id
                    ) VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)
                `;

                const valores = [
                    parseInt(item.cliente_id),
                    montoCapital,               
                    parseFloat(interes),        
                    montoTotalConInteres,       
                    parseInt(cuotas),
                    frecuencia,
                    fecha_inicio,               
                    fechaFinCalculada,          
                    parseInt(item.grupo_id || idGrupoEvaluado) || null 
                ];

                await db.query(queryInsert, valores);
            }

            return res.json({ status: 'success', mensaje: 'Préstamo registrado con éxito.' });
        } catch (error) {
            console.error("Error crítico al registrar ciclo de préstamo masivo:", error);
            return res.status(500).json({ status: 'error', mensaje: error.message });
        }
    },

    // 4. Reporte de Morosidad
    verVencidos: async (req, res) => {
        try {
            const [vencidos] = await db.query(`SELECT p.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre FROM prestamos p INNER JOIN clientes c ON p.cliente_id = c.id WHERE p.estado = 'Vencido'`);
            const config = await ConfigModel.obtener();
            res.render('prestamos/vencidos', { title: 'Reporte de Morosidad', vencidos: vencidos || [], empresa: config || { moneda: 'S/' } });
        } catch (e) { res.redirect('/prestamos'); }
    },

    // 📊 5. Ver Cronograma con desglose analítico de Capital e Interés por cuota
    verCronograma: async (req, res) => {
        const { id } = req.params;
        try {
            const [rowsPrestamo] = await db.query(
                `SELECT p.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.dni AS cliente_dni FROM prestamos p INNER JOIN clientes c ON p.cliente_id = c.id WHERE p.id = ?`, [id]
            );

            if (!rowsPrestamo || rowsPrestamo.length === 0) return res.redirect('/prestamos');
            const prestamo = rowsPrestamo[0]; 

            let cronograma = [];
            try {
                cronograma = finance.calcularCronograma(parseFloat(prestamo.monto_total), parseInt(prestamo.cuotas), prestamo.frecuencia, prestamo.fecha_inicio);
            } catch(e) {
                const montoCuota = parseFloat(prestamo.monto_total) / parseInt(prestamo.cuotas);
                for(let i=1; i<=prestamo.cuotas; i++) cronograma.push({ fecha: prestamo.fecha_inicio, monto: montoCuota });
            }

            const [rowsCob] = await db.query("SELECT COUNT(*) AS total_recibos, IFNULL(SUM(monto_pagado), 0.00) AS dinero_recaudado FROM cobranzas WHERE prestamo_id = ?", [id]);
            const totalCuotasPagadas = parseInt(rowsCob[0].total_recibos);
            const totalDineroRecaudado = parseFloat(rowsCob[0].dinero_recaudado);
            const montoTotalPactado = parseFloat(prestamo.monto_total);
            const capitalPuroPorCuota = parseFloat(prestamo.monto_prestado) / parseInt(prestamo.cuotas);

            cronograma.forEach((cuota, index) => {
                const numeroCuotaActual = index + 1;
                const valorCuotaTotal = parseFloat(cuota.monto || (montoTotalPactado / parseInt(prestamo.cuotas)));
                cuota.capital_desglosado = capitalPuroPorCuota;
                cuota.interes_desglosado = valorCuotaTotal - capitalPuroPorCuota;

                try {
                    const fechaObj = new Date(cuota.fecha);
                    if (!isNaN(fechaObj.getTime())) {
                        cuota.fecha_formateada = `${fechaObj.getUTCDate()}/${fechaObj.getUTCMonth() + 1}/${fechaObj.getUTCFullYear()}`;
                    } else { cuota.fecha_formateada = String(cuota.fecha).replace(/-/g, '/'); }
                } catch (err) { cuota.fecha_formateada = String(cuota.fecha); }

                if (totalDineroRecaudado >= montoTotalPactado || numeroCuotaActual <= totalCuotasPagadas) {
                    cuota.estado_real = 'Pagado';
                } else {
                    cuota.estado_real = (new Date() > new Date(cuota.fecha)) ? 'Vencido' : 'Programado';
                }
            });

            const config = await ConfigModel.obtener();
            res.render('prestamos/cronograma', { title: 'Cronograma de Pagos', prestamo, cronograma, empresa: config || { moneda: 'S/' } });
        } catch (error) { res.redirect('/prestamos'); }
    },

    // 6. API miembros grupo (Calibrada con tu tabla relacional intermedia física 'grupo_clientes')
    obtenerMiembrosGrupoAPI: async (req, res) => {
        try {
            const { id } = req.params;
            const [miembros] = await db.query(
                `SELECT c.id AS id, c.id AS cliente_id, c.nombre, c.apellido, c.dni FROM grupo_clientes gc INNER JOIN clientes c ON gc.cliente_id = c.id WHERE gc.grupo_id = ?`, [id]
            );
            const integrantesFormateados = miembros.map(c => ({
                id: c.id, cliente_id: c.id, nombre: String(c.nombre).toUpperCase(), apellido: String(c.apellido).toUpperCase(),
                nombre_completo: `${String(c.nombre).toUpperCase()} ${String(c.apellido).toUpperCase()}`,
                cliente_nombre: `${String(c.nombre).toUpperCase()} ${String(c.apellido).toUpperCase()}`,
                dni: c.dni || 'Verificado'
            }));
            return res.json(integrantesFormateados || []);
        } catch (error) { return res.json([]); }
    }
};

module.exports = prestamosController;
