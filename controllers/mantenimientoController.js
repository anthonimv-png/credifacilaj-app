const path = require('path');
const fs = require('fs');
const db = require('../config/db'); // Tu pool de conexión nativo

const mantenimientoController = {

    // NUEVO MÉTODO PURO: Genera la copia de seguridad sin depender de comandos cmd de Windows externos
    generarBackup: async (req, res) => {
        try {
            // 1. Definimos la ruta de la carpeta física backups
            const carpetaBackups = path.join(__dirname, '../backups');
            if (!fs.existsSync(carpetaBackups)) {
                fs.mkdirSync(carpetaBackups, { recursive: true });
            }

            // 2. Fabricamos el nombre del archivo con la fecha limpia
            const fecha = new Date();
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            const hora = String(fecha.getHours()).padStart(2, '0');
            const minuto = String(fecha.getMinutes()).padStart(2, '0');
            
            const nombreArchivo = `backup-credifacil-${año}-${mes}-${dia}_${hora}-${minuto}.sql`;
            const rutaDestinoFinal = path.join(carpetaBackups, nombreArchivo);

            // 3. Extracción estructural directa mediante consultas SQL
            // Listado real de tus 13 tablas en Laragon
            const tablas = [
                'bitacora', 'clientes', 'cobranzas', 'configuracion', 
                'cuentas_ahorro', 'empenos', 'gastos', 'grupos', 
                'grupo_clientes', 'movimientos_ahorro', 'pagos', 'prestamos', 'usuarios'
            ];

            let contenidoSql = `-- SCRIPT DE COPIA DE SEGURIDAD AUTOMÁTICA CREDIFACIL\n`;
            contenidoSql += `-- Generado automáticamente: ${fecha.toLocaleString()}\n`;
            contenidoSql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

            for (const tabla of tablas) {
                // Capturamos la estructura exacta (CREATE TABLE) de cada una de tus tablas
                try {
                    const [resCreate] = await db.query(`SHOW CREATE TABLE \`${tabla}\``);
                    if (resCreate && resCreate[0]) {
                        contenidoSql += `DROP TABLE IF EXISTS \`${tabla}\`;\n`;
                        contenidoSql += `${resCreate[0]['Create Table']};\n\n`;
                    }

                    // Capturamos las filas de datos reales guardadas adentro
                    const [filas] = await db.query(`SELECT * FROM \`${tabla}\``);
                    if (filas && filas.length > 0) {
                        for (const fila of filas) {
                            const columnas = Object.keys(fila).map(col => `\`${col}\``).join(', ');
                            const valores = Object.values(fila).map(val => {
                                if (val === null) return 'NULL';
                                if (typeof val === 'number') return val;
                                // Limpiamos strings de caracteres raros
                                return `'${String(val).replace(/(['"\\])/g, '\\$1')}'`;
                            }).join(', ');
                            
                            contenidoSql += `INSERT INTO \`${tabla}\` (${columnas}) VALUES (${valores});\n`;
                        }
                        contenidoSql += `\n`;
                    }
                } catch (errTable) {
                    console.log(`Saltando tabla por seguridad o inexistencia: ${tabla}`);
                }
            }

            contenidoSql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

            // 4. Escribimos físicamente el archivo .sql en tu disco duro
            fs.writeFileSync(rutaDestinoFinal, contenidoSql, 'utf-8');

            req.flash('mensajeExito', `¡Copia de seguridad guardada con éxito! Archivo: ${nombreArchivo}`);
            res.redirect('/prestamos');

        } catch (error) {
            console.error("Error crítico en el controlador de backup:", error);
            req.flash('mensajeError', 'Ocurrió un error interno al procesar el respaldo.');
            res.redirect('/prestamos');
        }
    }
};

module.exports = mantenimientoController;
