const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');

// Ruta GET: Al ingresar aquí, se dispara el empaquetado automático de tus tablas
router.get('/backup', mantenimientoController.generarBackup);

module.exports = router;
