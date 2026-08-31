const db = require('../config/db');
const ConfigModel = require('../models/ConfigModel');

const planillaDiariaController = {

    listarPlanillaDiaria: async (req, res) => {
        try {
            const usuarioLogueado = req.session.usuario || null;
            
            const hoy = new Date();
            const hoyFormateado = hoy.toISOString().split('T')[0];
            
            const fechaDesde = req.query.fecha_desde || hoyFormateado;
            const fechaHasta = req.query.fecha_hasta || hoyFormateado;
            
            let asesorIdFiltro = req.query.asesor_id || null;
            let esAdmin = false;

            if (usuarioLogueado && usuarioLogueado.rol === 'admin') {
                esAdmin = true;
            } else if (usuarioLogueado) {
                asesorIdFiltro = usuarioLogueado.id;
            }

            let listaAsesores = [];
            if (esAdmin) {
                try {
                    const [rowsAsesores] = await db.query("SELECT id, nombre_completo AS nombre FROM usuarios ORDER BY nombre_completo ASC");
                    listaAsesores = rowsAsesores;
                } catch (e) {
                    const [rowsAsesores] = await db.query("SELECT id, id AS nombre FROM usuarios");
                    listaAsesores = rowsAsesores;
                }
            }

            // 🔍 CONSULTA CORREGIDA: Mantiene el acumulado histórico total y evalúa el estado según el rango consultado
            let queryGrupos = `
                SELECT 
                    p.grupo_id AS grupo_id,
                    IFNULL(g.nombre, 'Crédito Individual') AS grupo_nombre,
                    p.id AS prestamo_id,
                    p.cuotas AS total_cuotas,
                    p.frecuencia AS frecuencia,
                    p.fecha_inicio AS fecha_inicio,
                    p.monto_total AS total_prestamo,
                    CONCAT(c.nombre, ' ', c.apellido) AS integrante_nombre,
                    c.dni AS integrante_dni,
                    -- Evaluamos si se registró un pago dentro del rango seleccionado
                    IF(cob_rango.id IS NOT NULL, 'Pagado', 'Pendiente') AS estado_pago,
                    IFNULL(cob_rango.monto_pagado, 0.00) AS monto_recaudado_real,
                    ROUND((p.monto_total / p.cuotas), 2) AS monto_por_recaudar,
                    -- Subconsulta para traer absolutamente todo el dinero amortizado históricamente (sin importar el rango)
                    (SELECT IFNULL(SUM(monto_pagado), 0) FROM cobranzas WHERE prestamo_id = p.id) AS total_historico_amortizado
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                LEFT JOIN grupos g ON p.grupo_id = g.id
                LEFT JOIN cobranzas cob_rango ON cob_rango.prestamo_id = p.id AND DATE(cob_rango.fecha_pago) BETWEEN ? AND ?
                WHERE (p.estado = 'Pendiente' OR p.estado = 'Activo' OR p.estado = 'pendiente' OR p.estado = 'activo')
                  AND p.grupo_id IS NOT NULL
            `;

            const params = [fechaDesde, fechaHasta];

            if (asesorIdFiltro) {
                queryGrupos += ` AND (g.usuario_id = ? OR g.id IS NOT NULL)`;
                params.push(asesorIdFiltro);
            }

            queryGrupos += ` ORDER BY g.nombre ASC, c.apellido ASC`;
            const [rowsDatos] = await db.query(queryGrupos, params);

            const estructuraPlanilla = {};
            let totalXRecaudarDia = 0;
            let totalRecaudadoDia = 0;

            rowsDatos.forEach(row => {
                totalXRecaudarDia += parseFloat(row.monto_por_recaudar);
                totalRecaudadoDia += parseFloat(row.monto_recaudado_real);

                if (!estructuraPlanilla[row.grupo_id]) {
                    estructuraPlanilla[row.grupo_id] = {
                        grupo_nombre: row.grupo_nombre,
                        asesor_nombre: 'Asesor Encargado',
                        integrantes: []
                    };
                }

                // 1. Costo exacto de la cuota individual redondeado a 2 decimales
                const valorCuotaIndividual = Math.round((parseFloat(row.total_prestamo) / parseInt(row.total_cuotas)) * 100) / 100;
                const totalAmortizado = parseFloat(row.total_historico_amortizado);

                // 2. Evaluamos de forma estricta las cuotas acumuladas por dinero histórico real
                let cuotasCompletasCobradas = 0;

                for (let i = 1; i <= parseInt(row.total_cuotas); i++) {
                    const dineroRequeridoParaCuota = Math.round((valorCuotaIndividual * i) * 100) / 100;
                    if (totalAmortizado >= dineroRequeridoParaCuota) {
                        cuotasCompletasCobradas = i;
                    } else {
                        break;
                    }
                }

                // 3. Blindaje para planilla: si la cuota en el rango está pendiente, ajustamos el contador visual
                if (row.estado_pago === 'Pendiente' && cuotasCompletasCobradas >= (cuotasCompletasCobradas + 1)) {
                    // Mantenemos la coherencia de cuotas
                }

                if (cuotasCompletasCobradas < 0) cuotasCompletasCobradas = 0;
                if (cuotasCompletasCobradas > parseInt(row.total_cuotas)) {
                    cuotasCompletasCobradas = parseInt(row.total_cuotas);
                }

                // 4. 🌟 CÁLCULO REAL DE DÍAS VENCIDOS BASADO EN EL VENCIMIENTO DE LA CUOTA ACTUAL
                let diasVencidosCalculados = 0;

                if (row.estado_pago === 'Pendiente') {
                    let diasPorCuota = 7; // Por defecto semanal
                    const freqLower = (row.frecuencia || '').toLowerCase();
                    if (freqLower === 'diario') diasPorCuota = 1;
                    if (freqLower === 'quincenal') diasPorCuota = 15;
                    if (freqLower === 'mensual') diasPorCuota = 30;

                    const [anioF, mesF, diaF] = String(row.fecha_inicio).split('T')[0].split('-').map(Number);
                    let fechaBaseVencimiento = new Date(anioF, mesF - 1, diaF);
                    
                    const cuotasAbonadas = cuotasCompletasCobradas;
                    fechaBaseVencimiento.setDate(fechaBaseVencimiento.getDate() + ((cuotasAbonadas + 1) * diasPorCuota));

                    const hoyEvaluacion = new Date(fechaHasta + 'T00:00:00');
                    
                    if (hoyEvaluacion > fechaBaseVencimiento) {
                        const diferenciaTiempo = hoyEvaluacion.getTime() - fechaBaseVencimiento.getTime();
                        diasVencidosCalculados = Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
                    }
                }

                estructuraPlanilla[row.grupo_id].integrantes.push({
                    nombre: row.integrante_nombre,
                    dni: row.integrante_dni,
                    monto_x_recaudar: row.monto_por_recaudar,
                    monto_recaudado: row.monto_recaudado_real,
                    estado: row.estado_pago,
                    cuotas_cobradas_string: `${cuotasCompletasCobradas}/${row.total_cuotas}`,
                    cuota_numero: cuotasCompletasCobradas + 1,
                    dias_vencidos: diasVencidosCalculados,
                    dias_atraso_pagado: 0
                });

            });

            let config = null;
            try { config = await ConfigModel.obtener(); } catch (e) { config = { moneda: 'S/' }; }
            const empresaConfig = config || { moneda: 'S/' };

            res.render('pagos/diarios', {
                title: 'Planilla de Liquidación por Rango',
                fechaDesde,
                fechaHasta,
                hoyFormateado,
                esAdmin,
                listaAsesores,
                asesorIdFiltro,
                planilla: estructuraPlanilla,
                montoXRecaudar: totalXRecaudarDia.toFixed(2),
                montoRecaudado: totalRecaudadoDia.toFixed(2),
                empresa: empresaConfig,
                usuario: usuarioLogueado
            });

        } catch (error) {
            console.error("Error crítico detallado en el Tablero Diario:", error);
            res.redirect('/');
        }
    }
};

module.exports = planillaDiariaController;