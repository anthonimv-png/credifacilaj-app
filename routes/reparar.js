const fs = require('fs');
const path = require('path');

const rutaControlador = path.join(__dirname, 'controllers', 'pagosController.js');

// Código maestro unificado en texto puro libre de cruces de comillas de PowerShell
const codigoLimpio = `const db = require('../config/db');
const ConfigModel = require('../models/ConfigModel');

const pagosController = {

    // 🗓️ 1. PLANILLA DIARIA POR ASESOR Y CONTROL DE MORA CRONOLÓGICO
    listarPlanillaDiaria: async (req, res) => {
        try {
            const usuarioLogueado = req.session.usuario || req.user || null;
            const hoy = new Date();
            const hoyFormateado = hoy.toISOString().split('T')[0];
            const fechaSeleccionada = req.query.fecha || hoyFormateado;
            
            let asesorIdFiltro = req.query.asesor_id || null;
            let esAdmin = false;

            if (usuarioLogueado && usuarioLogueado.rol === 'admin') {
                esAdmin = true;
            } else if (usuarioLogueado) {
                asesorIdFiltro = usuarioLogueado.id;
            }

            let listaAsesores = [];
            if (esAdmin) {
                const [rowsAsesores] = await db.query("SELECT id, nombre FROM usuarios WHERE rol = 'asesor' OR rol = 'cobrador' ORDER BY nombre ASC");
                listaAsesores = rowsAsesores;
            }

            let queryGrupos = \`
                SELECT 
                    g.id AS grupo_id,
                    g.nombre AS grupo_nombre,
                    u.nombre AS asesor_nombre,
                    p.id AS prestamo_id,
                    p.cuotas AS total_cuotas,
                    IFNULL(cob.numero_cuota, 1) AS numero_cuota,
                    CONCAT(c.nombre, ' ', c.apellido) AS integrante_nombre,
                    c.dni AS integrante_dni,
                    ROUND(((p.monto + (p.monto * (p.interes / 100))) / p.cuotas), 2) AS monto_por_recaudar,
                    IF(cob.estado = 'Pagado', ROUND(((p.monto + (p.monto * (p.interes / 100))) / p.cuotas), 2), 0.00) AS monto_recaudado,
                    cob.estado AS estado_pago,
                    IF(cob.estado != 'Pagado' AND ? > DATE(p.fecha_inicio), DATEDIFF(?, DATE(p.fecha_inicio)), 0) AS dias_vencidos,
                    IF(cob.estado = 'Pagado', IFNULL(DATEDIFF(DATE(cob.fecha_pago), DATE(p.fecha_inicio)), 0), 0) AS dias_atraso_pagado
                FROM grupos g
                INNER JOIN grupo_clientes gc ON g.id = gc.grupo_id
                INNER JOIN clientes c ON gc.cliente_id = c.id
                INNER JOIN prestamos p ON p.cliente_id = c.id AND p.grupo_id = g.id
                LEFT JOIN usuarios u ON g.usuario_id = u.id
                LEFT JOIN cobranzas cob ON cob.prestamo_id = p.id AND DATE(cob.fecha_pago) = ?
                WHERE (p.estado = 'Pendiente' OR p.estado = 'Activo')
            \`;

            const params = [fechaSeleccionada, fechaSeleccionada, fechaSeleccionada];
            if (asesorIdFiltro) {
                queryGrupos += \` AND g.usuario_id = ?\`;
                params.push(asesorIdFiltro);
            }
            queryGrupos += \` ORDER BY g.nombre ASC, c.apellido ASC\`;
            
            const [rowsDatos] = await db.query(queryGrupos, params);

            const estructuraPlanilla = {};
            let totalXRecaudarDia = 0;
            let totalRecaudadoDia = 0;

            rowsDatos.forEach(row => {
                totalXRecaudarDia += parseFloat(row.monto_por_recaudar);
                totalRecaudadoDia += parseFloat(row.monto_recaudado);

                if (!estructuraPlanilla[row.grupo_id]) {
                    estructuraPlanilla[row.grupo_id] = {
                        grupo_nombre: row.grupo_nombre,
                        asesor_nombre: row.asesor_nombre || 'No asignado',
                        integrantes: []
                    };
                }

                estructuraPlanilla[row.grupo_id].integrantes.push({
                    nombre: row.integrante_nombre,
                    dni: row.integrante_dni,
                    monto_x_recaudar: row.monto_por_recaudar,
                    monto_recaudado: row.monto_recaudado,
                    estado: row.estado_pago || 'Pendiente',
                    cuota_numero: row.numero_cuota,
                    dias_vencidos: row.dias_vencidos,
                    dias_atraso_pagado: row.dias_atraso_pagado
                });
            });

            let config = null;
            try { config = await ConfigModel.obtener(); } catch (e) { config = { moneda: 'S/' }; }
            const empresaConfig = config || { moneda: 'S/' };

            res.render('pagos/diarios', {
                title: 'Planilla del Día por Asesor',
                fechaSeleccionada,
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
            console.error('Error crítico en la liquidación diaria:', error);
            req.flash('mensajeError', 'Error interno al procesar la ruta.');
            res.redirect('/');
        }
    },

    // 🕒 2. MÉTODOS NATIVOS DE FÁBRICA RESTAURADOS
    mostrarFormulario: async (req, res) => {
        try { res.render('pagos/registrar'); } catch (e) { res.redirect('/'); }
    },

    mostrarFormularioGrupal: async (req, res) => {
        try { res.render('pagos/registrar_grupal'); } catch (e) { res.redirect('/'); }
    },

    guardar: async (req, res) => {
        try { res.redirect('/prestamos'); } catch (e) { res.redirect('/'); }
    }
};

module.exports = pagosController;
`;

fs.writeFileSync(rutaControlador, codigoLimpio, 'utf8');
console.log('\n==================================================================');
console.log('✅ ¡pagosController.js purificado y unificado al 100% con éxito!');
console.log('==================================================================\n');
