const db = require('../config/db');

const grupoController = {
    
       // 📁 1. LISTAR GRUPOS (Sincronización total de integrantes por memoria de Node - CORREGIDO)
    listar: async (req, res) => {
        try {
            const [rowsGrupos] = await db.query("SELECT * FROM grupos ORDER BY id DESC");

            // Validamos que rowsGrupos sea un arreglo válido antes de recorrerlo
            const listaGrupos = Array.isArray(rowsGrupos) ? rowsGrupos : [];

            // Recorremos cada grupo y le inyectamos sus clientas unidas en la tabla intermedia
            for (const grupo of listaGrupos) {
                const [miembros] = await db.query(`
                    SELECT CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo 
                    FROM grupo_clientes gc 
                    INNER JOIN clientes c ON gc.cliente_id = c.id 
                    WHERE gc.grupo_id = ?
                `, [grupo.id]);

                if (miembros && miembros.length > 0) {
                    grupo.integrantes_roles = miembros.map(m => String(m.nombre_completo).toUpperCase()).join(', ');
                } else {
                    grupo.integrantes_roles = 'SIN INTEGRANTES ASIGNADAS ACTUALMENTE.';
                }
            }

            // Renderizado HTML correcto para la plantilla listar.ejs
            return res.render('grupos/listar', {
                title: 'Grupos de Crédito',
                grupos: listaGrupos
            });

        } catch (error) {
            console.error("Error en listado de grupos:", error);
            // En lugar de redirigir a ciegas, pasamos un arreglo vacío seguro para evitar pantallas colgadas
            return res.render('grupos/listar', {
                title: 'Grupos de Crédito',
                grupos: []
            });
        }
    },

    // 📁 2. MOSTRAR FORMULARIO CREAR
    mostrarFormularioCrear: async (req, res) => {
        res.render('grupos/crear', { title: 'Crear Grupo de Crédito' });
    },

    // 💾 3. GUARDAR GRUPO (REPARADO: Bloquea duplicidad de nombres y responde con error JSON)
    guardar: async (req, res) => {
        try {
            const { nombre, integrantes } = req.body;

            if (!nombre) {
                return res.status(400).json({ status: 'error', mensaje: 'El nombre del grupo es obligatorio.' });
            }

            const nombreLimpio = nombre.trim().toUpperCase();

            // 🧠 ESCUDO DE DUPLICADOS: Consultamos a Laragon si ya existe un grupo con ese mismo nombre
            const [grupoExistente] = await db.query(
                "SELECT id FROM grupos WHERE nombre = ?", 
                [nombreLimpio]
            );

            if (grupoExistente && grupoExistente.length > 0) {
                // Si encuentra una coincidencia, frena el proceso de golpe y manda la alerta al frontend
                return res.status(400).json({ 
                    status: 'duplicado', 
                    mensaje: `El grupo "${nombreLimpio}" ya existe registrado en el sistema. No pueden haber 2 o más grupos con el mismo nombre.` 
                });
            }

            // A) Si pasa el escudo, insertamos el nuevo grupo en Laragon de forma normal
            const [resultadoGrupo] = await db.query(
                "INSERT INTO grupos (nombre, descripcion) VALUES (?, ?)", 
                [nombreLimpio, 'Junta Masiva Activa']
            );
            
            const nuevoGrupoId = resultadoGrupo.insertId;

            // B) Vinculamos cada clienta en la tabla intermedia grupo_clientes
            const listaIntegrantes = integrantes || req.body.clientes || req.body.miembros || [];
            if (listaIntegrantes && listaIntegrantes.length > 0) {
                for (const clienta of listaIntegrantes) {
                    const clienteId = parseInt(clienta.cliente_id || clienta.id);
                    const rolAsignado = clienta.rol || 'Integrante';

                    if (clienteId) {
                        await db.query(
                            "INSERT INTO grupo_clientes (grupo_id, cliente_id, rol) VALUES (?, ?, ?)",
                            [nuevoGrupoId, clienteId, rolAsignado]
                        );
                    }
                }
            }

            return res.status(200).json({ status: 'success', mensaje: 'Grupo registrado con éxito.' });

        } catch (error) {
            console.error("Error crítico al asentar el grupo masivo:", error);
            return res.status(500).json({ status: 'error', mensaje: 'Error interno en Laragon.' });
        }
    },

    // 👥 4. VER MIEMBROS REPOTENCIADO DE SERVIDOR (Carga clientes e integrantes directo en vivo)
    verMiembros: async (req, res) => {
        try {
            const { id } = req.params;
            
            // A) Consultamos el grupo principal
            const [rowsGrupo] = await db.query("SELECT * FROM grupos WHERE id = ?", [id]);
            const grupoUnico = rowsGrupo && rowsGrupo.length > 0 ? rowsGrupo[0] : { id: id, nombre: 'PAMPAS' };

            // B) Jalamos las integrantes actuales asociadas a la junta
            const [miembros] = await db.query(`
                SELECT c.id, c.id AS cliente_id, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.dni, gc.rol
                FROM grupo_clientes gc 
                INNER JOIN clientes c ON gc.cliente_id = c.id 
                WHERE gc.grupo_id = ?
            `, [id]);

            // C) 🧠 LOGICA CLAVE: Traemos a ABSOLUTAMENTE TODOS los clientes registrados de Laragon para poblar el buscador nativo
            const [todosLosClientes] = await db.query(`
                SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo, dni 
                FROM clientes 
                ORDER BY nombre ASC
            `);

            res.render('grupos/editar', { 
                title: 'Miembros del Grupo', 
                grupo: grupoUnico, 
                miembros: miembros || [],
                integrantes: miembros || [],
                todos_los_clientes: todosLosClientes || [] // Alimenta tu nuevo menú desplegable nativo indestructible
            });
        } catch (error) {
            console.error("Error en verMiembros nativo:", error);
            res.redirect('/grupos');
        }
    },

     // 💾 4.5 GUARDADO TRADICIONAL POST (¡CORREGIDO PARA ENUM Y ENTRADAS EN LOTE!)
    guardarMiembrosTradicional: async (req, res) => {
        try {
            // Evaluamos las propiedades comunes que envían los formularios tradicionales
            const grupo_id = req.body.grupo_id || req.body.id;
            
            // Sincronizamos variaciones de nombres que pueda tener el frontend (clientes_ids o integrantes)
            const clientes_ids = req.body.clientes_ids || req.body.clientes || req.body.integrantes;
            const roles = req.body.roles || req.body.rol;

            if (!grupo_id) {
                console.error("⚠️ Intento de guardado tradicional sin grupo_id válido.");
                return res.redirect('/grupos');
            }

            // Limpiamos los nexos anteriores para evitar duplicados en la base de datos
            await db.query("DELETE FROM grupo_clientes WHERE grupo_id = ?", [grupo_id]);

            // Si el formulario traía clientas en lote, las re-asentamos una por una
            if (clientes_ids) {
                // Si el formulario envía un solo cliente, Node lo lee como string. Lo transformamos a Array seguro:
                const arrClientes = Array.isArray(clientes_ids) ? clientes_ids : [clientes_ids];
                const arrRoles = Array.isArray(roles) ? roles : [roles];

                for (let i = 0; i < arrClientes.length; i++) {
                    // Extraemos el ID numérico puro (manejando si viene como objeto o string)
                    const cId = parseInt(arrClientes[i].cliente_id || arrClientes[i].id || arrClientes[i]);
                    
                    // Capturamos el rol de la posición correspondiente, limpiándolo para calzar con el ENUM
                    let rAsig = arrRoles[i] ? String(arrRoles[i]).trim().toUpperCase() : 'INTEGRANTE';
                    
                    if (rAsig.includes('LIDER') || rAsig.includes('COORDINADORA')) {
                        rAsig = 'LIDER';
                    } else {
                        rAsig = 'INTEGRANTE';
                    }
                    
                    if (cId) {
                        await db.query(
                            "INSERT INTO grupo_clientes (grupo_id, cliente_id, rol) VALUES (?, ?, ?)",
                            [grupo_id, cId, rAsig]
                        );
                    }
                }
            }

            res.redirect('/grupos');
        } catch (error) {
            console.error("❌ Error en guardado tradicional de modificaciones:", error);
            res.redirect('/grupos');
        }
    },

    // 🗑️ 5. ELIMINAR GRUPO
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query("DELETE FROM grupo_clientes WHERE grupo_id = ?", [id]);
            await db.query("DELETE FROM grupos WHERE id = ?", [id]);
            res.redirect('/grupos');
        } catch (error) { res.redirect('/grupos'); }
    }
};

// ... Todo tu código anterior de grupoController ...

// 🗑️ Borra las dos exportaciones anteriores y deja SOLO esta línea:
module.exports = grupoController;

