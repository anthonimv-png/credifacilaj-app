const db = require('../config/db');

class AhorroModel {

    // 1. Listar todas las cuentas
    static async obtenerTodas() {
        try {
            const query = `
                SELECT a.id, a.saldo_actual, c.nombre, c.apellido, c.dni 
                FROM cuentas_ahorro a
                INNER JOIN clientes c ON a.cliente_id = c.id
                ORDER BY a.saldo_actual DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error al obtener cuentas:", error);
            throw error;
        }
    }

    // 2. Buscar por Cliente
    static async buscarPorCliente(clienteId) {
        try {
            const query = 'SELECT * FROM cuentas_ahorro WHERE cliente_id = ?';
            const [rows] = await db.query(query, [clienteId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 3. Obtener por ID de Cuenta
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT a.*, c.nombre, c.apellido, c.email, c.dni 
                FROM cuentas_ahorro a
                INNER JOIN clientes c ON a.cliente_id = c.id
                WHERE a.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 4. Crear Cuenta
    static async crear(clienteId) {
        try {
            const query = 'INSERT INTO cuentas_ahorro (cliente_id, saldo_actual) VALUES (?, 0.00)';
            const [result] = await db.query(query, [clienteId]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 5. Registrar Movimiento
    static async registrarMovimiento(cuentaId, tipo, monto, observacion) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insertamos la observación (ahora que la columna existe)
            await connection.query(
                'INSERT INTO movimientos_ahorro (cuenta_id, tipo_movimiento, monto, observacion) VALUES (?, ?, ?, ?)',
                [cuentaId, tipo, monto, observacion]
            );

            let querySaldo;
            if (tipo === 'deposito') {
                querySaldo = 'UPDATE cuentas_ahorro SET saldo_actual = saldo_actual + ? WHERE id = ?';
            } else {
                querySaldo = 'UPDATE cuentas_ahorro SET saldo_actual = saldo_actual - ? WHERE id = ?';
            }
            await connection.query(querySaldo, [monto, cuentaId]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 6. Historial
    static async obtenerMovimientos(cuentaId) {
        try {
            const query = 'SELECT * FROM movimientos_ahorro WHERE cuenta_id = ? ORDER BY fecha_movimiento DESC';
            const [rows] = await db.query(query, [cuentaId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 7. Obtener Movimiento Específico (Para el Voucher)
    static async obtenerMovimientoPorId(movimientoId) {
        try {
            // Esta es la consulta que fallaba porque faltaba la columna en la BD
            const query = `
                SELECT 
                    m.id as mov_id, m.tipo_movimiento, m.monto, m.fecha_movimiento, m.observacion,
                    c.id as cuenta_id, cl.nombre, cl.apellido, cl.dni
                FROM movimientos_ahorro m
                INNER JOIN cuentas_ahorro c ON m.cuenta_id = c.id
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                WHERE m.id = ?
            `;
            const [rows] = await db.query(query, [movimientoId]);
            return rows[0];
        } catch (error) {
            console.error("Error SQL en obtenerMovimientoPorId:", error);
            throw error;
        }
    }
}

module.exports = AhorroModel;