const db = require('../config/db');

class ClienteModel {
    
    // 1. Obtener paginados tradicionales
    static async obtenerPaginados(limit, offset) {
        try {
            const query = 'SELECT * FROM clientes ORDER BY created_at DESC LIMIT ? OFFSET ?';
            const [rows] = await db.query(query, [limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Contar total de registros en la tabla
    static async contarTotal() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM clientes');
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 3. Crear cliente (ACTUALIZADO CON REFERENCIA Y 4 FOTOS SIMULTÁNEAS)
    static async crear(datos) {
        try {
            const { 
                dni, nombre, apellido, telefono, direccion, email, 
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio,
                foto_1, foto_2, foto_3, foto_4 
            } = datos;

            const query = `
                INSERT INTO clientes 
                (dni, nombre, apellido, telefono, direccion, email, negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio, foto_1, foto_2, foto_3, foto_4) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(query, [
                dni, nombre, apellido, telefono, direccion, email, 
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio,
                foto_1, foto_2, foto_3, foto_4
            ]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 4. Buscar por DNI
    static async buscarPorDNI(dni) {
        try {
            const [rows] = await db.query('SELECT * FROM clientes WHERE dni = ?', [dni]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 5. Obtener Todos los clientes ordenados alfabéticamente
    static async obtenerTodos() {
        try {
            const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre ASC');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 6. Buscador Paginado por múltiples criterios
    static async buscarPaginados(criterio, limit, offset) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `
                SELECT * FROM clientes 
                WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? 
                ORDER BY nombre ASC 
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda, limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 7. Contar cantidad de registros dentro de una búsqueda
    static async contarBusqueda(criterio) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `
                SELECT COUNT(*) as total FROM clientes 
                WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda]);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 8. Obtener cliente específico por ID
    static async obtenerPorId(id) {
        try {
            const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 9. Actualizar Cliente (ADAPTADO CON CONTROL DE 4 IMÁGENES Y REFERENCIA)
    static async actualizar(id, datos) {
        try {
            const { 
                dni, nombre, apellido, telefono, direccion, email, 
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio,
                foto_1, foto_2, foto_3, foto_4 
            } = datos;
            
            // Construimos la base de la consulta de actualización
            let query = `
                UPDATE clientes 
                SET dni = ?, nombre = ?, apellido = ?, telefono = ?, direccion = ?, email = ?, 
                    negocio = ?, direccion_negocio = ?, cuenta_bcp = ?, numero_yape = ?, referencia_domicilio = ?
            `;
            const params = [
                dni, nombre, apellido, telefono, direccion, email, 
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio
            ];

            // Evaluamos condicionalmente si se cargó un archivo para cada campo de imagen
            if (foto_1) { query += `, foto_1 = ?`; params.push(foto_1); }
            if (foto_2) { query += `, foto_2 = ?`; params.push(foto_2); }
            if (foto_3) { query += `, foto_3 = ?`; params.push(foto_3); }
            if (foto_4) { query += `, foto_4 = ?`; params.push(foto_4); } // NUEVO: Recibo

            query += ` WHERE id = ?`;
            params.push(id);

            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ClienteModel;
