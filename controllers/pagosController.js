const db = require('../config/db');
const ConfigModel = require('../models/ConfigModel');

const pagosController = {

    // 1. Abre el formulario de cobro para préstamos individuales
    mostrarFormulario: async (req, res) => {
        try {
            const { id_prestamo } = req.params;
            const [rows] = await db.query(
                "SELECT p.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre FROM prestamos p INNER JOIN clientes c ON p.cliente_id = c.id WHERE p.id = ?", 
                [id_prestamo]
            );

            res.render('pagos/registrar', {
                title: 'Registrar Pago Individual',
                prestamo: rows || null
            });
        } catch (error) {
            console.error("Error al cargar formulario individual:", error);
            res.redirect('/prestamos');
        }
    },

    // 2. Formulario masivo grupal (CALIBRADO CONTRA CONGELAMIENTO: Jala estados 'Pendiente' y 'Activo')
    mostrarFormularioGrupal: async (req, res) => {
        try {
            const { id_grupo } = req.params;

            const [rowsGrupo] = await db.query("SELECT * FROM grupos WHERE id = ?", [id_grupo]);
            const grupoEncontrado = rowsGrupo && rowsGrupo.length > 0 ? rowsGrupo : { id: id_grupo, nombre: 'Junta Grupal Masiva' };

            // 🔍 CONSULTA INTELIGENTE REPARADA: Incluye el término 'Pendiente' con el que nace el reenganche en Laragon
            const [integrantes] = await db.query(
                `SELECT 
                    p.id AS prestamo_id, 
                    p.monto_total, 
                    p.cuotas AS total_cuotas, 
                    CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                    ROUND((p.monto_total / p.cuotas), 2) AS monto_cuota_defecto,
                    (SELECT COUNT(*) FROM cobranzas cob WHERE cob.prestamo_id = p.id) AS cuotas_pagadas,
                    IFNULL((SELECT SUM(cob.monto_pagado) FROM cobranzas cob WHERE cob.prestamo_id = p.id), 0.00) AS total_ya_pagado
                 FROM prestamos p 
                 INNER JOIN clientes c ON p.cliente_id = c.id 
                 WHERE p.grupo_id = ? 
                   AND p.estado IN ('Pendiente', 'Activo', 'Vigente', 'Vencido', 'pendiente', 'activo') -- 👈 Admite tus estados nativos
                 HAVING cuotas_pagadas < total_cuotas`, 
                [id_grupo]
            );

            let config = null;
            try { config = await ConfigModel.obtener(); } catch (e) { config = { moneda: 'S/' }; }
            const empresaConfig = config || { moneda: 'S/' };

            res.render('pagos/registrar_grupal', {
                title: 'Cobranza Grupal Masiva',
                grupo: grupoEncontrado,
                grupo_id: id_grupo,
                integrantes: integrantes || [],
                prestamos: integrantes || [],
                empresa: empresaConfig
            });

        } catch (error) {
            console.error("Error crítico detallado en el formulario grupal:", error);
            res.redirect('/prestamos');
        }
    },
    // 3. Método Individual Nivel del Formulario de fábrica
    guardar: async (req, res) => {
        try {
            const { prestamo_id, monto_pagado, num_cuota_pagada, fecha_pago } = req.body;
            const query = "INSERT INTO cobranzas (prestamo_id, monto_pagado, num_cuota_pagada, fecha_pago) VALUES (?, ?, ?, ?)";
            await db.query(query, [prestamo_id, monto_pagado, num_cuota_pagada, fecha_pago || new Date()]);
            res.redirect('/prestamos');
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al procesar el abono");
        }
    },

    // 📥 4. AUTOPISTA MASIVA: Guarda los cobros y cambia el estado a 'Pagado' para liberar el panel de control
    guardarMasivo: async (req, res) => {
        try {
            const { cobros } = req.body;

            if (!cobros || cobros.length === 0) {
                return res.status(400).json({ status: 'error', mensaje: 'No se enviaron cobranzas válidas.' });
            }

            for (const abono of cobros) {
                const [verificar] = await db.query(
                    "SELECT cuotas, estado, (SELECT COUNT(*) FROM cobranzas WHERE prestamo_id = ?) AS ya_pagadas FROM prestamos WHERE id = ?",
                    [abono.prestamo_id, abono.prestamo_id]
                );

                if (verificar && verificar.length > 0) {
                    const { cuotas, ya_pagadas, estado } = verificar;
                    
                    if (ya_pagadas >= cuotas || estado === 'Pagado') {
                        continue; 
                    }

                    // 1. Asentamos el abono en Laragon
                    const queryCobranza = `
                        INSERT INTO cobranzas (prestamo_id, monto_pagado, num_cuota_pagada, fecha_pago) 
                        VALUES (?, ?, ?, ?)
                    `;
                    await db.query(queryCobranza, [
                        abono.prestamo_id,
                        parseFloat(abono.monto_pagado),
                        parseInt(abono.num_cuota_pagada),
                        abono.fecha_pago
                    ]);

                    // 2. Si completa la última cuota, muta físicamente a 'Pagado' (así libera capital en calle)
                    if (parseInt(abono.num_cuota_pagada) >= parseInt(cuotas)) {
                        await db.query("UPDATE prestamos SET estado = 'Pagado' WHERE id = ?", [abono.prestamo_id]);
                        console.log(`✨ ¡Préstamo ID ${abono.prestamo_id} liquidado en Laragon!`);
                    }
                }
            }

            return res.status(200).json({ status: 'success', mensaje: 'Cobranza masiva asentada con éxito total.' });

        } catch (error) {
            console.error("Error crítico en la inyección de abonos masivos:", error);
            return res.status(500).json({ status: 'error', mensaje: 'Error interno en la base de datos.' });
        }
    }
};

module.exports = pagosController;
