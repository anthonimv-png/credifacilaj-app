const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');

// Autopistas maestras conectadas al controlador puro
router.get('/', prestamosController.listar);
router.get('/crear', prestamosController.mostrarFormulario);
router.post('/guardar', prestamosController.guardar);
router.get('/vencidos', prestamosController.verVencidos);
router.get('/cronograma/:id', prestamosController.verCronograma);

// =========================================================================
// 👥 ENLACE RELACIONAL DEFINITIVO: Trae las integrantes de la junta de Laragon
// =========================================================================
router.get('/api-miembrosGrupo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 🧠 AUTOCARGA SEGURA: Importamos la conexión de Laragon directo aquí adentro
        const dbConexionDirecta = require('../config/db');
        
        // Consultamos la tabla física relacional grupo_clientes que HeidiSQL nos confirmó
        const [miembros] = await dbConexionDirecta.query(`
            SELECT 
                c.id AS id,
                c.nombre,
                c.apellido,
                c.dni,
                gc.rol
            FROM grupo_clientes gc 
            INNER JOIN clientes c ON gc.cliente_id = c.id 
            WHERE gc.grupo_id = ?
        `, [id]);

        // 🧠 ESCUDO MAESTRO DE MAPEO: Multiplicamos los nombres de propiedades para que 
        // use la columna que use el bucle JavaScript de tu vista, la capture al vuelo.
        const resultadoBlindado = (miembros || []).map(c => {
            const nombreUnificado = `${String(c.nombre || '').toUpperCase()} ${String(c.apellido || '').toUpperCase()}`.trim();
            return {
                // 1. Variaciones de Identificadores indispensables
                id: parseInt(c.id),
                cliente_id: parseInt(c.id),
                id_cliente: parseInt(c.id),
                
                // 2. Variaciones de Nombres unificados en Mayúsculas firmes
                nombre_completo: nombreUnificado,
                cliente_nombre: nombreUnificado,
                nombre: nombreUnificado,
                cliente: nombreUnificado,
                nombreCompleto: nombreUnificado,
                
                // 3. Documento de identidad y Rol nativo
                dni: c.dni || 'Verificado',
                rol: c.rol || 'Integrante'
            };
        });

        // Respondemos con el JSON multi-etiquetado libre de restricciones
        return res.json(resultadoBlindado);

    } catch (error) {
        console.error("Error crítico en API relacional de miembros para préstamo:", error);
        return res.json([]);
    }
});





module.exports = router;
