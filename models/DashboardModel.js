const db = require('../config/db');

class DashboardModel {
    
    // 1. Obtener totales generales
    static async obtenerTotales() {
        try {
            const [clientes] = await db.query('SELECT COUNT(*) as total FROM clientes');
            const [prestamos] = await db.query("SELECT SUM(monto_prestado) as total FROM prestamos WHERE estado = 'pendiente'");
            const [empenos] = await db.query("SELECT COUNT(*) as total FROM empenos WHERE estado = 'en_custodia'");
            const [pagos] = await db.query("SELECT SUM(monto_pagado) as total FROM pagos");
            const [totalPrestadoHistorico] = await db.query("SELECT SUM(monto_prestado) as total FROM prestamos");
            
            // NUEVO: Sumar saldo de ahorros
            const [ahorros] = await db.query("SELECT SUM(saldo_actual) as total FROM cuentas_ahorro");

            return {
                clientes: clientes[0].total || 0,
                dineroPrestado: prestamos[0].total || 0,
                articulosEmpeno: empenos[0].total || 0,
                dineroCobrado: pagos[0].total || 0,
                totalPrestadoHistorico: totalPrestadoHistorico[0].total || 0,
                totalAhorros: ahorros[0].total || 0 // <--- Dato nuevo
            };

        } catch (error) {
            throw error;
        }
    }

    // 2. Obtener datos para Gráficos
    static async obtenerDatosGraficos() {
        try {
            const query = `
                SELECT estado, COUNT(*) as cantidad 
                FROM prestamos 
                GROUP BY estado
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = DashboardModel;