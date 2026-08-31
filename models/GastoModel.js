const db = require('../config/db');

class GastoModel {

    // 1. Obtener Paginados
    static async obtenerPaginados(limit, offset) {
        try {
            const query = 'SELECT * FROM gastos ORDER BY fecha_gasto DESC LIMIT ? OFFSET ?';
            const [rows] = await db.query(query, [limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Contar Total
    static async contarTotal() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM gastos');
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 3. Buscar Paginados
    static async buscarPaginados(busqueda, limit, offset) {
        try {
            const criterio = `%${busqueda}%`;
            const query = `
                SELECT * FROM gastos 
                WHERE descripcion LIKE ? OR categoria LIKE ? 
                ORDER BY fecha_gasto DESC 
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [criterio, criterio, limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Contar Búsqueda
    static async contarBusqueda(busqueda) {
        try {
            const criterio = `%${busqueda}%`;
            const query = `
                SELECT COUNT(*) as total FROM gastos 
                WHERE descripcion LIKE ? OR categoria LIKE ?
            `;
            const [rows] = await db.query(query, [criterio, criterio]);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 5. Crear Gasto (ACTUALIZADO CON NUEVOS CAMPOS)
    static async crear(datos) {
        try {
            const { descripcion, monto, categoria, registrado_por, observacion } = datos;
            const query = `
                INSERT INTO gastos (descripcion, monto, categoria, registrado_por, observacion, fecha_gasto) 
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            const [result] = await db.query(query, [descripcion, monto, categoria, registrado_por, observacion]);
            return result;
        } catch (error) {
            console.error("Error SQL al crear gasto:", error); // Esto te ayudará a ver el error en la terminal
            throw error;
        }
    }

    // 6. Eliminar Gasto
    static async eliminar(id) {
        try {
            const query = 'DELETE FROM gastos WHERE id = ?';
            const [result] = await db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = GastoModel;