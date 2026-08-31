const db = require('../config/db');

class CajaModel {

    // 1. Total Cobrado (Ingresos por Préstamos)
    static async totalPagos(fecha) {
        try {
            const query = 'SELECT SUM(monto_pagado) as total FROM pagos WHERE DATE(fecha_pago) = ?';
            const [rows] = await db.query(query, [fecha]);
            return rows[0].total || 0;
        } catch (error) {
            throw error;
        }
    }

    // 2. Total Prestado (Egresos por Préstamos Nuevos)
    static async totalPrestamosEntregados(fecha) {
        try {
            const query = 'SELECT SUM(monto_prestado) as total FROM prestamos WHERE DATE(fecha_inicio) = ?';
            const [rows] = await db.query(query, [fecha]);
            return rows[0].total || 0;
        } catch (error) {
            throw error;
        }
    }

    // 3. Total Gastos (Egresos Operativos)
    static async totalGastos(fecha) {
        try {
            const query = 'SELECT SUM(monto) as total FROM gastos WHERE DATE(fecha_gasto) = ?';
            const [rows] = await db.query(query, [fecha]);
            return rows[0].total || 0;
        } catch (error) {
            throw error;
        }
    }

    // 4. Total Ahorros (Ingresos por Depósito o Egresos por Retiro) - ¡CORREGIDO!
    static async totalAhorros(fecha, tipo) {
        try {
            // tipo puede ser 'deposito' o 'retiro'
            const query = `
                SELECT SUM(monto) as total 
                FROM movimientos_ahorro 
                WHERE DATE(fecha_movimiento) = ? AND tipo_movimiento = ?
            `;
            const [rows] = await db.query(query, [fecha, tipo]);
            return rows[0].total || 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CajaModel;