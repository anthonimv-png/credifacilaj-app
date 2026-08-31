const db = require('../config/db');

class BitacoraModel {

    // 1. Obtener últimos registros
    static async obtenerUltimos(limite = 50) {
        try {
            // Ordenamos por ID descendente para ver lo más nuevo primero
            const query = 'SELECT * FROM bitacora ORDER BY id DESC LIMIT ?';
            const [rows] = await db.query(query, [limite]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Registrar nueva acción
    static async registrar(usuario, accion, detalle) {
        try {
            const query = 'INSERT INTO bitacora (usuario, accion, detalle, fecha) VALUES (?, ?, ?, NOW())';
            // Protección por si usuario llega nulo
            const userFinal = usuario || 'Sistema'; 
            await db.query(query, [userFinal, accion, detalle]);
            return true;
        } catch (error) {
            console.error("Error registrando en bitácora:", error);
            return false;
        }
    }
}

module.exports = BitacoraModel;