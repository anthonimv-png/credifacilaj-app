const db = require('../config/db');

class EmpenoModel {

    // 1. Obtener todos
    static async obtenerTodos() {
        try {
            const query = `
                SELECT e.*, c.nombre, c.apellido, c.dni 
                FROM empenos e
                INNER JOIN clientes c ON e.cliente_id = c.id
                ORDER BY e.created_at DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Crear
    static async crear(datos) {
        try {
            const { 
                cliente_id, nombre_articulo, descripcion, 
                valor_tasacion, monto_prestado, fecha_limite, imagen 
            } = datos;

            const query = `
                INSERT INTO empenos 
                (cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite, imagen) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(query, [
                cliente_id, nombre_articulo, descripcion, 
                valor_tasacion, monto_prestado, fecha_limite, imagen
            ]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 3. Cambiar estado
    static async cambiarEstado(id, nuevoEstado) {
        try {
            const query = 'UPDATE empenos SET estado = ? WHERE id = ?';
            const [result] = await db.query(query, [nuevoEstado, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 4. (NUEVO) Obtener empeños de un cliente
    static async obtenerPorCliente(clienteId) {
        try {
            const query = 'SELECT * FROM empenos WHERE cliente_id = ? ORDER BY created_at DESC';
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = EmpenoModel;