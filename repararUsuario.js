const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function repararAdmin() {
    console.log('--- INICIANDO REPARACIÓN DE USUARIO ---');

    try {
        const email = 'admin@sistema.com';
        const passwordPlana = '123456'; // Esta será tu contraseña

        // 1. Encriptar la contraseña correctamente
        const passwordEncriptada = await bcrypt.hash(passwordPlana, 10);

        // 2. Eliminar el usuario si ya existe (para evitar duplicados o errores)
        await db.query('DELETE FROM usuarios WHERE email = ?', [email]);
        console.log('✅ Usuario anterior eliminado (limpieza).');

        // 3. Insertar el usuario nuevo con la contraseña encriptada
        const query = `
            INSERT INTO usuarios (nombre_completo, email, password, rol, estado) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await db.query(query, ['Administrador', email, passwordEncriptada, 'admin', 1]);
        
        console.log('✅ Usuario Administrador creado exitosamente.');
        console.log('-------------------------------------------');
        console.log('📧 Email:    ' + email);
        console.log('🔑 Password: ' + passwordPlana);
        console.log('-------------------------------------------');
        console.log('YA PUEDES INICIAR SESIÓN. Cierra este script.');
        
        process.exit(); // Terminar el script

    } catch (error) {
        console.error('❌ ERROR AL REPARAR:', error);
        process.exit(1);
    }
}

repararAdmin();