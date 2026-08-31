const db = require('../config/db');

class PagoModel {

    // 1. Registrar un pago
    static async crear(datos) {
        try {
            const { prestamo_id, monto_pagado, observaciones } = datos;
            const query = `
                INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) 
                VALUES (?, ?, ?)
            `;
            const [result] = await db.query(query, [prestamo_id, monto_pagado, observaciones]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 2. Obtener el total pagado de un préstamo
    static async obtenerTotalPagado(prestamoId) {
        try {
            const query = 'SELECT SUM(monto_pagado) as total FROM pagos WHERE prestamo_id = ?';
            const [rows] = await db.query(query, [prestamoId]);
            return rows[0].total || 0;
        } catch (error) {
            throw error;
        }
    }

    // 3. Obtener historial de pagos
    static async obtenerHistorial(prestamoId) {
        try {
            const query = 'SELECT * FROM pagos WHERE prestamo_id = ? ORDER BY fecha_pago DESC';
            const [rows] = await db.query(query, [prestamoId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Obtener detalle completo (CORREGIDO: Incluye EMAIL)
    static async obtenerDetalle(pagoId) {
        try {
            const query = `
                SELECT 
                    pg.id as pago_id, pg.monto_pagado, pg.fecha_pago, pg.observaciones,
                    pr.id as prestamo_id, pr.monto_total as deuda_total,
                    c.nombre, c.apellido, c.dni, c.email
                FROM pagos pg
                INNER JOIN prestamos pr ON pg.prestamo_id = pr.id
                INNER JOIN clientes c ON pr.cliente_id = c.id
                WHERE pg.id = ?
            `;
            const [rows] = await db.query(query, [pagoId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PagoModel;