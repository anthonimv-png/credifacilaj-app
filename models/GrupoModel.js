const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Conexión activa a Laragon
const grupoController = require('../controllers/grupoController');

// 📥 Autopista 1: Catálogo Principal de Grupos Registrados
router.get('/', grupoController.listar);

// 📁 Autopista 2: Formularios de Creación de Juntas Masivas
router.get('/crear', grupoController.mostrarFormularioCrear);
router.post('/guardar', grupoController.guardar);

// 🔍 BUSCADOR INTERNO EXCLUSIVO: Conecta tus inputs directo a la tabla de clientes en soles
const buscadorClientesInline = async (req, res) => {
    try {
        const palabra = (req.query.q || '').trim();
        if (!palabra) return res.json([]);

        const [clientes] = await db.query(
            `SELECT id, nombre, apellido, dni 
             FROM clientes 
             WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? 
             LIMIT 10`,
            [`%${palabra}%`, `%${palabra}%`, `%${palabra}%`]
        );

        const resultado = clientes.map(c => ({
            id: c.id,
            nombre: `${String(c.nombre).toUpperCase()} ${String(c.apellido).toUpperCase()}`,
            dni: c.dni || 'Verificado'
        }));

        return res.json(resultado);
    } catch (error) {
        return res.json([]);
    }
};

// Sincronizamos todas las URLs posibles que tus vistas 'crear.ejs' y 'editar.ejs' buscan para el autocompletado
router.get('/buscar-cliente-inline', buscadorClientesInline);
router.get('/api-buscar', buscadorClientesInline);

// 👥 MULTI-ENLACE INDESTRUCTIBLE PARA MIEMBROS:
// Si tu sistema de fábrica llama a /miembros o a /editar, ambos cables golpean la misma carga relacional
router.get('/miembros/:id', grupoController.verMiembros);
router.get('/editar/:id', grupoController.verMiembros);

// 💾 🛠️ CORREGIDO: GUARDADO DE ROLES Y EDICIONES DIRECTO AL PROCESADOR TRADICIONAL
router.post('/guardar-miembros-api', grupoController.guardarMiembrosTradicional);
router.post('/editar/:id', grupoController.guardarMiembrosTradicional);

// 🗑️ Autopista de Eliminación Física de Laragon
router.get('/eliminar/:id', grupoController.eliminar);

// =========================================================================
// 📊 RESANADOR DE DASHBOARD GIGANTE (Mantiene tus gráficas e inicio estables sin SweetAlerts)
// =========================================================================
const apiDashboardInline = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nombre, descripcion FROM grupos ORDER BY id DESC");
        return res.json(rows || []);
    } catch (error) { return res.json([]); }
};

router.get('/api', apiDashboardInline);
router.get('/all', apiDashboardInline);
router.get('/listar-json', apiDashboardInline);

// Enlace directo al receptor tradicional de guardado sin fetch
router.post('/guardar-miembros-tradicional', grupoController.guardarMiembrosTradicional);

module.exports = router;
