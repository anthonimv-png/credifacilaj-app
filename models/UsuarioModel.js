const db = require('../config/db');

class UsuarioModel {
    
    // 1. Buscar por email (Login)
    static async buscarPorEmail(email) {
        try {
            const query = 'SELECT * FROM usuarios WHERE email = ?';
            const [rows] = await db.query(query, [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 2. Buscar por ID (Perfil)
    static async buscarPorId(id) {
        try {
            const query = 'SELECT * FROM usuarios WHERE id = ?';
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 3. Obtener todos (Admin)
    static async obtenerTodos() {
        try {
            const query = 'SELECT id, nombre_completo, email, rol, estado, created_at FROM usuarios ORDER BY id DESC';
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Crear usuario
    static async crear(datos) {
        try {
            const { nombre_completo, email, password, rol } = datos;
            const query = `
                INSERT INTO usuarios (nombre_completo, email, password, rol, estado) 
                VALUES (?, ?, ?, ?, 1)
            `;
            const [result] = await db.query(query, [nombre_completo, email, password, rol]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 5. Eliminar usuario
    static async eliminar(id) {
        try {
            const query = 'DELETE FROM usuarios WHERE id = ?';
            const [result] = await db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 6. (NUEVO) Actualizar Datos Básicos (Perfil)
    static async actualizarDatos(id, nombre, email) {
        try {
            const query = 'UPDATE usuarios SET nombre_completo = ?, email = ? WHERE id = ?';
            const [result] = await db.query(query, [nombre, email, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 7. (NUEVO) Actualizar Contraseña
    static async actualizarPassword(id, passwordHash) {
        try {
            const query = 'UPDATE usuarios SET password = ? WHERE id = ?';
            const [result] = await db.query(query, [passwordHash, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UsuarioModel;