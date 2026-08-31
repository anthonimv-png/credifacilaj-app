const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Documentos Individuales
router.get('/contrato/:id', reportesController.generarContrato);
router.get('/ticket/:id', reportesController.generarTicket);
router.get('/cronograma_pdf/:id', reportesController.generarCronogramaPDF);
router.get('/estado_cuenta/:id', reportesController.generarEstadoCuenta);

// NUEVO: Ticket de Ahorro
router.get('/ticket_ahorro/:id', reportesController.generarTicketAhorro);

// Reportes Excel
router.get('/excel/prestamos', reportesController.exportarExcelPrestamos);
router.get('/panel', reportesController.mostrarPanel);
router.post('/generar', reportesController.descargarReporteExcel);

module.exports = router;