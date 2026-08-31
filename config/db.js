const mysql = require('mysql2');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Crear el Pool de conexiones
// Usamos 'createPool' en lugar de 'createConnection' para mejor rendimiento
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // Máximo 10 conexiones simultáneas
    queueLimit: 0
});

// Convertir a promesas para poder usar async/await (código más moderno)
const promisePool = pool.promise();

// Probar la conexión al iniciar
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('LA CONEXIÓN CON LA BASE DE DATOS SE CERRÓ.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('LA BASE DE DATOS TIENE MUCHAS CONEXIONES.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('LA CONEXIÓN FUE RECHAZADA (Revisa tus credenciales en .env).');
        }
    }
    if (connection) {
        console.log('✅ Conectado exitosamente a la Base de Datos MySQL');
        connection.release();
    }
    return;
});

module.exports = promisePool;