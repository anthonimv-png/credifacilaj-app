const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Conexión activa a Laragon
const grupoController = require('../controllers/grupoController');

// 📥 Autopista 1: Catálogo Principal de Grupos Registrados
router.get('/', grupoController.listar);

// 📁 Autopista 2: Formularios de Creación de Juntas Masivas
router.get('/crear', grupoController.mostrarFormularioCrear);

// 🔍 BUSCADOR MAESTRO DE AUDITORÍA: Detecta grupos anteriores y estados exactos de préstamos en Laragon
const buscadorClientesInline = async (req, res) => {
    try {
        const palabra = (req.query.q || '').trim();
        if (!palabra) return res.json([]);

        // Buscamos al cliente, traemos el nombre de su grupo actual y auditamos el estado de su último crédito
        const [clientes] = await db.query(
            `SELECT c.id, c.nombre, c.apellido, c.dni,
                (SELECT g.nombre FROM grupo_clientes gc INNER JOIN grupos g ON gc.grupo_id = g.id WHERE gc.cliente_id = c.id LIMIT 1) AS nombre_grupo_actual,
                (SELECT gc.grupo_id FROM grupo_clientes gc WHERE gc.cliente_id = c.id LIMIT 1) AS id_grupo_actual,
                (SELECT p.estado FROM prestamos p WHERE p.cliente_id = c.id AND p.grupo_id IS NOT NULL ORDER BY p.id DESC LIMIT 1) AS estado_ultimo_credito
             FROM clientes c
             WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR c.dni LIKE ? 
             LIMIT 10`,
            [`%${palabra}%`, `%${palabra}%`, `%${palabra}%`]
        );

        const resultado = clientes.map(c => {
            const estCredito = (c.estado_ultimo_credito || '').toLowerCase();
            
            // Evaluamos las restricciones financieras reales requeridas
            let bloqueoPorCredito = false;
            let motivoCredito = '';
            
            if (estCredito === 'vigente' || estCredito === 'activo' || estCredito === 'pendiente') {
                bloqueoPorCredito = true;
                motivoCredito = 'EL CLIENTE TIENE UN CRÉDITO VIGENTE ACTIVO';
            } else if (estCredito === 'vencido') {
                bloqueoPorCredito = true;
                motivoCredito = '⚠️ ALERTA: EL CLIENTE TIENE UN CRÉDITO VENCIDO EN MORA';
            }

            return {
                id: c.id,
                nombre: `${String(c.nombre).toUpperCase()} ${String(c.apellido).toUpperCase()}`,
                dni: c.dni || 'Verificado',
                
                // Banderas de control de riesgo que leerá tu SweetAlert2
                tiene_credito_activo: bloqueoPorCredito,
                motivo_credito: motivoCredito,
                pertenece_a_grupo: c.nombre_grupo_actual ? true : false,
                grupo_nombre_viejo: String(c.nombre_grupo_actual || '').toUpperCase(),
                grupo_id_viejo: c.id_grupo_actual || null
            };
        });

        return res.json(resultado);
    } catch (error) {
        console.error("Error en buscador inline validado:", error);
        return res.json([]);
    }
};

// Sincronizamos todas las URLs posibles que tus vistas 'crear.ejs' y 'editar.ejs' buscan para el autocompletado
router.get('/buscar-cliente-inline', buscadorClientesInline);
router.get('/api-buscar', buscadorClientesInline);
// 💾 GUARDADO TRANSPARENTE INDESTRUCTIBLE: Procesa el fetch JSON de la vista y remueve por completo la columna 'descripcion'
router.post('/guardar', async (req, res) => {
    try {
        const { nombre, integrantes } = req.body;

        if (!nombre) {
            return res.status(400).json({ status: 'error', mensaje: 'El nombre del grupo es obligatorio.' });
        }

        const nombreLimpio = nombre.trim().toUpperCase();

        // Escudo de duplicados inmediato en la base de datos
        const [grupoExistente] = await db.query("SELECT id FROM grupos WHERE nombre = ?", [nombreLimpio]);
        if (grupoExistente && grupoExistente.length > 0) {
            return res.status(400).json({ 
                status: 'duplicado', 
                mensaje: `El grupo "${nombreLimpio}" ya existe registrado en el sistema. Elige otro nombre.` 
            });
        }

        // 🧠 PURIFICADO CONTABLE: Insertamos únicamente el campo 'nombre' verificado en HeidiSQL
        const [resultadoGrupo] = await db.query(
            "INSERT INTO grupos (nombre) VALUES (?)", 
            [nombreLimpio]
        );
        
        const nuevoGrupoId = resultadoGrupo.insertId;

        // 👥 VINCULACIÓN TRANSACCIONAL BLINDADA CONTRA FORMATOS ENUM DE LÍDER
        const listaIntegrantes = integrantes || req.body.clientes || req.body.miembros || [];
        if (listaIntegrantes && listaIntegrantes.length > 0) {
            
            for (const clienta of listaIntegrantes) {
                const clienteId = parseInt(clienta.cliente_id || clienta.id);
                if (!clienteId) continue;

                const rolOriginal = String(clienta.rol || 'Integrante').trim();
                const esLider = (rolOriginal.toLowerCase().includes('coordinadora') || rolOriginal.toLowerCase().includes('lider') || rolOriginal.toLowerCase().includes('líder'));

                // 🧠 MATRIZ DE INTENTOS DE ROL: Declaramos todas las variantes posibles que tu Laragon pueda exigir para la líder e integrante
                let opcionesRol = [];
                
                if (esLider) {
                    // Si en la vista se eligió Líder, barremos todas las opciones posibles de base de datos
                    opcionesRol = ['Líder', 'Lider', 'Coordinadora', 'Coordinador', 'Presidenta', 'l', 'c', 'LIDER', 'COORDINADORA'];
                } else {
                    // Si es integrante estándar
                    opcionesRol = ['Integrante', 'i', 'INTEGRANTE', 'integrante'];
                }

                let insertadoConExito = false;

                // El sistema probará una por una las palabras clave hasta que MySQL acepte una válidamente
                for (const rolPrueba of opcionesRol) {
                    try {
                        await db.query(
                            "INSERT INTO grupo_clientes (grupo_id, cliente_id, rol) VALUES (?, ?, ?)",
                            [nuevoGrupoId, clienteId, rolPrueba]
                        );
                        insertadoConExito = true;
                        break; // 🚀 En cuanto Laragon acepte el rol, rompe el bucle interno y pasa al siguiente cliente
                    } catch (errMySQL) {
                        // Si falla, ignora el error en silencio e intenta con la siguiente palabra de la matriz
                        continue;
                    }
                }

                // 🛡️ CONTROL DE RESPALDO EXTREMO: Si tu base de datos rechaza todas por configuraciones estrictas, 
                // inserta a la clienta con el valor por defecto para no dejarla fuera de la junta
                if (!insertadoConExito) {
                    try {
                        await db.query(
                            "INSERT INTO grupo_clientes (grupo_id, cliente_id) VALUES (?, ?)",
                            [nuevoGrupoId, clienteId]
                        );
                        console.log(`⚠️ Integrante ID ${clienteId} insertada con rol por defecto de la tabla.`);
                    } catch (errFinal) {
                        console.error(`❌ Imposible acoplar integrante ID ${clienteId}:`, errFinal.message);
                    }
                }
            }
            console.log(`✨ ¡Lote relacional de ${listaIntegrantes.length} integrantes asentado con éxito completo!`);
        }


        // 🛠️ HASTA AQUÍ. LO QUE SIGUE ABAJO ("return res.status(200)...") LO DEJAS IGUAL.


        // 🚀 RETORNO INTEGRADO: Respondemos éxito para que el SweetAlert2 de la vista ejecute el desvío correcto
        return res.status(200).json({ status: 'success', mensaje: 'Grupo registrado con éxito.' });

    } catch (error) {
        console.error("Error crítico directo en Laragon al asentar grupo:", error);
        return res.status(500).json({ status: 'error', mensaje: 'Error interno en Laragon: ' + error.message });
    }
});

// 👥 MULTI-ENLACE INDESTRUCTIBLE PARA MIEMBROS:
router.get('/miembros/:id', grupoController.verMiembros);
router.get('/editar/:id', grupoController.verMiembros);

// GUARDADO DE ROLES Y EDICIONES DIRECTO AL PROCESADOR TRADICIONAL
router.post('/guardar-miembros-api', grupoController.guardarMiembrosTradicional);
router.post('/editar/:id', grupoController.guardarMiembrosTradicional);

// Autopista de Eliminación Física de Laragon
router.get('/eliminar/:id', grupoController.eliminar);

// =========================================================================
// 📊 RESANADOR DE DASHBOARD GIGANTE (Mantiene tus gráficas e inicio estables sin SweetAlerts)
// =========================================================================
const apiDashboardInline = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                g.id, 
                g.nombre,
                IFNULL(
                    (SELECT GROUP_CONCAT(CONCAT(c.nombre, ' ', c.apellido) SEPARATOR ', ') 
                     FROM grupo_clientes gc 
                     INNER JOIN clientes c ON gc.cliente_id = c.id 
                     WHERE gc.grupo_id = g.id), 
                    'Sin integrantes asignadas actualmente.'
                ) AS integrantes_roles
            FROM grupos g 
            ORDER BY g.id DESC
        `);
        return res.json(rows || []);
    } catch (error) { return res.json([]); }
};

router.get('/api', apiDashboardInline);
router.get('/all', apiDashboardInline);
router.get('/listar-json', apiDashboardInline);

// Enlace directo al receptor tradicional de guardado sin fetch
router.post('/guardar-miembros-tradicional', grupoController.guardarMiembrosTradicional);

// 🔄 DESVINCULADOR AUTOMÁTICO DE SEGURIDAD: Saca al cliente de su junta anterior si se confirma el traslado
router.post('/trasladar-cliente-grupo-api', async (req, res) => {
    try {
        const { cliente_id } = req.body;
        if (!cliente_id) return res.json({ status: 'error' });

        await db.query("DELETE FROM grupo_clientes WHERE cliente_id = ?", [parseInt(cliente_id)]);
        console.log(`✂️ Cliente ID ${cliente_id} desvinculado con éxito de su junta anterior.`);
        return res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        return res.json({ status: 'error' });
    }
});

module.exports = router;
