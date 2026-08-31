const db = require('../config/db');

class ReporteAvanzadoModel {

    // 1. Reporte de Préstamos
    static async prestamosPorFecha(desde, hasta) {
        try {
            // Aseguramos que 'hasta' cubra todo el día
            const fechaFin = hasta + ' 23:59:59';
            const fechaInicio = desde + ' 00:00:00';

            const query = `
                SELECT p.id, c.nombre, c.apellido, c.dni, p.monto_prestado, p.monto_total, p.fecha_inicio, p.estado 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE p.fecha_inicio >= ? AND p.fecha_inicio <= ?
                ORDER BY p.fecha_inicio DESC
            `;
            const [rows] = await db.query(query, [fechaInicio, fechaFin]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Reporte de Pagos (Cobros)
    static async pagosPorFecha(desde, hasta) {
        try {
            const fechaFin = hasta + ' 23:59:59';
            const fechaInicio = desde + ' 00:00:00';

            const query = `
                SELECT pg.id, pg.monto_pagado, pg.fecha_pago, c.nombre, c.apellido, p.id as prestamo_id 
                FROM pagos pg
                INNER JOIN prestamos p ON pg.prestamo_id = p.id
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE pg.fecha_pago >= ? AND pg.fecha_pago <= ?
                ORDER BY pg.fecha_pago DESC
            `;
            const [rows] = await db.query(query, [fechaInicio, fechaFin]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 3. Reporte de Gastos
    static async gastosPorFecha(desde, hasta) {
        try {
            const fechaFin = hasta + ' 23:59:59';
            const fechaInicio = desde + ' 00:00:00';

            const query = `
                SELECT * FROM gastos 
                WHERE fecha_gasto >= ? AND fecha_gasto <= ?
                ORDER BY fecha_gasto DESC
            `;
            const [rows] = await db.query(query, [fechaInicio, fechaFin]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReporteAvanzadoModel;