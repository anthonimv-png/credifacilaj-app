const EmpenoModel = require('../models/EmpenoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel'); // <--- Importamos Configuración

const empenosController = {

    // 1. Listar Empeños (CON MONEDA)
    listar: async (req, res) => {
        try {
            const empenos = await EmpenoModel.obtenerTodos();
            
            // Obtener configuración
            const config = await ConfigModel.obtener();
            const empresaConfig = config || { moneda: '$' };

            res.render('empenos/index', { 
                title: 'Empeños y Garantías',
                empenos: empenos,
                empresa: empresaConfig // <--- Enviamos a la vista
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar los empeños');
            res.redirect('/');
        }
    },

    // 2. Formulario Nuevo Empeño
    mostrarFormulario: async (req, res) => {
        try {
            const clientes = await ClienteModel.obtenerTodos();
            
            // Obtener configuración para el formulario
            const config = await ConfigModel.obtener();
            const empresaConfig = config || { moneda: '$' };

            res.render('empenos/crear', { 
                title: 'Nuevo Empeño',
                clientes: clientes,
                empresa: empresaConfig // <--- Enviamos a la vista
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar formulario');
            res.redirect('/empenos');
        }
    },

    // 3. Guardar Empeño
    guardar: async (req, res) => {
        const { cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite } = req.body;
        const imagen = req.file ? req.file.filename : null;

        if (!cliente_id || !nombre_articulo || !monto_prestado) {
            req.flash('mensajeError', 'Complete los campos obligatorios');
            return res.redirect('/empenos/crear');
        }

        try {
            await EmpenoModel.crear({
                cliente_id,
                nombre_articulo,
                descripcion,
                valor_tasacion,
                monto_prestado,
                fecha_limite,
                imagen
            });

            req.flash('mensajeExito', 'Artículo registrado en garantía');
            res.redirect('/empenos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al guardar empeño');
            res.redirect('/empenos/crear');
        }
    },

    // 4. Devolver Artículo (Liberar)
    liberar: async (req, res) => {
        const { id } = req.params;
        try {
            await EmpenoModel.actualizarEstado(id, 'devuelto');
            req.flash('mensajeExito', 'Artículo marcado como devuelto al cliente');
            res.redirect('/empenos');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al liberar artículo');
            res.redirect('/empenos');
        }
    }
};

module.exports = empenosController;