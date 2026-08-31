const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const multer = require('multer');
const path = require('path');

// 1. CONFIGURACIÓN DE ALMACENAMIENTO (Multer): Define dónde y cómo renombrar las imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Las fotos físicas se guardarán en esta ruta dentro de tu carpeta public
        cb(null, 'public/uploads/clientes');
    },
    filename: (req, file, cb) => {
        // Le asignamos un nombre único con la fecha de hoy para evitar que se sobreescriban archivos idénticos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cliente-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 2. RUTAS DE NAVEGACIÓN (VISTAS)
router.get('/', clientesController.listar);
router.get('/crear', clientesController.mostrarCrear);
router.get('/perfil/:id', clientesController.verPerfil);
router.get('/editar/:id', clientesController.mostrarEdicion);

// 3. RUTAS DE PROCESOS (POST/UPDATE) - Aquí inyectamos el capturador de hasta 3 fotos máximas
router.post('/guardar', upload.array('fotos', 4), clientesController.guardar);
router.post('/actualizar/:id', upload.array('fotos', 4), clientesController.actualizar);

module.exports = router;
