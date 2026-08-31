const express = require('express');
const router = express.Router();
const simuladorController = require('../controllers/simuladorController');

// GET: Mostrar formulario
router.get('/', simuladorController.mostrar);

// POST: Realizar cálculo
router.post('/calcular', simuladorController.calcular);

module.exports = router;