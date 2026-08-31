require('dotenv').config();
const mysql = require('mysql2/promise');

async function instalarTablas() {
    console.log('--- INICIANDO INSTALACIÓN DE TABLAS DE AHORRO ---');
    
    // 1. Crear conexión usando tus credenciales del .env
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    });

    console.log(`✅ Conectado a la base de datos: ${process.env.DB_NAME}`);

    try {
        // 2. Crear Tabla Cuentas
        const sqlCuentas = `
            CREATE TABLE IF NOT EXISTS cuentas_ahorro (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                saldo_actual DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            )
        `;
        await connection.query(sqlCuentas);
        console.log('✅ Tabla "cuentas_ahorro" verificada/creada.');

        // 3. Crear Tabla Movimientos
        const sqlMovimientos = `
            CREATE TABLE IF NOT EXISTS movimientos_ahorro (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cuenta_id INT NOT NULL,
                tipo_movimiento ENUM('deposito', 'retiro') NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                observacion TEXT,
                fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cuenta_id) REFERENCES cuentas_ahorro(id) ON DELETE CASCADE
            )
        `;
        await connection.query(sqlMovimientos);
        console.log('✅ Tabla "movimientos_ahorro" verificada/creada.');

        console.log('\n¡INSTALACIÓN COMPLETADA CON ÉXITO! 🚀');
        console.log('Ya puedes usar el módulo de Ahorros.');

    } catch (error) {
        console.error('❌ ERROR AL CREAR TABLAS:', error.message);
    } finally {
        await connection.end();
    }
}

instalarTablas();