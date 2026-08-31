const db = require('../config/db');

class ConfigModel {
    
    // Obtener la configuración actual (siempre ID 1)
    static async obtener() {
        try {
            const [rows] = await db.query('SELECT * FROM configuracion WHERE id = 1');
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Actualizar datos
    static async actualizar(datos) {
        try {
            const { nombre_empresa, ruc, direccion, telefono, email_contacto, moneda, logo } = datos;
            
            let query = `
                UPDATE configuracion 
                SET nombre_empresa=?, ruc=?, direccion=?, telefono=?, email_contacto=?, moneda=?
            `;
            
            const params = [nombre_empresa, ruc, direccion, telefono, email_contacto, moneda];

            // Solo actualizamos el logo si se subió uno nuevo
            if (logo) {
                query += `, logo=?`;
                params.push(logo);
            }

            query += ` WHERE id = 1`;

            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ConfigModel;