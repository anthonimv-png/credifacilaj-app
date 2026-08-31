const express = require('express');
const router = express.Router();
const planillaDiariaController = require('../controllers/planillaDiariaController');
const protegerRuta = require('../middleware/auth');

// Autopista limpia conectada directamente al controlador nuevo
router.get('/diarios', protegerRuta, planillaDiariaController.listarPlanillaDiaria);

module.exports = router;
