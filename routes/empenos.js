const express = require('express');
const router = express.Router();
const empenosController = require('../controllers/empenosController');
const protegerRuta = require('../middleware/auth');
const upload = require('../middleware/upload'); // <--- Necesario para la foto del artículo

// Seguridad: Proteger todas las rutas
router.use(protegerRuta);

// 1. Listar Empeños
router.get('/', empenosController.listar);

// 2. Formulario de Nuevo Empeño
router.get('/crear', empenosController.mostrarFormulario);

// 3. Guardar Empeño (Incluye subida de imagen)
router.post('/guardar', upload.single('imagen'), empenosController.guardar);

// 4. Liberar/Devolver Artículo
router.get('/liberar/:id', empenosController.liberar);

module.exports = router;