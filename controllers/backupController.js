const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const backupController = {

    // Generar y descargar copia de seguridad
    descargar: (req, res) => {
        const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const fileName = `backup_sistema_${fecha}_${Date.now()}.sql`;
        // Guardamos temporalmente en la carpeta uploads
        const filePath = path.join(__dirname, '../public/uploads', fileName);

        // Datos de conexión desde .env
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'sistema_prestamos';

        // Construir comando (mysqldump debe estar en las variables de entorno o ser accesible)
        // Nota: Si la contraseña está vacía, no ponemos -p
        let command = `mysqldump -u ${dbUser} `;
        if (dbPass) {
            command += `-p${dbPass} `;
        }
        command += `${dbName} > "${filePath}"`;

        // Ejecutar el comando en el sistema operativo
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error generando backup:', error);
                req.flash('mensajeError', 'Error al crear el respaldo. Verifica que mysqldump esté instalado y accesible.');
                return res.redirect('/config');
            }

            // Si todo salió bien, enviamos el archivo al navegador
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Error en descarga:', err);
                }
                // Importante: Borramos el archivo temporal después de descargar para no llenar el disco
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('No se pudo borrar el archivo temporal:', e);
                }
            });
        });
    }
};

module.exports = backupController;