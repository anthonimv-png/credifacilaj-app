const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

// Autopistas de Cobranzas
router.get('/registrar/:id_prestamo', pagosController.mostrarFormulario);
router.get('/registrar-grupal/:id_grupo', pagosController.mostrarFormularioGrupal);

// POST: Procesador individual nativo
router.post('/guardar', pagosController.guardar);

// POST MASIVO: Procesa el paquete de abonos editables del grupo
router.post('/guardar-masivo', pagosController.guardarMasivo);

module.exports = router;
