const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const protegerRuta = require('../middleware/auth'); // Seguridad

// Proteger todas las rutas de este módulo
router.use(protegerRuta);

// 1. Listar Gastos
router.get('/', gastosController.listar);

// 2. Guardar Gasto
router.post('/guardar', gastosController.guardar);

// 3. Eliminar Gasto
router.get('/eliminar/:id', gastosController.eliminar);

module.exports = router;