const ConfigModel = require('../models/ConfigModel');

const configController = {

    // Mostrar formulario de configuración
    mostrar: async (req, res) => {
        try {
            const config = await ConfigModel.obtener();
            res.render('config/index', { 
                title: 'Configuración de Empresa',
                config: config 
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // Guardar cambios
    actualizar: async (req, res) => {
        try {
            const { nombre_empresa, ruc, direccion, telefono, email_contacto, moneda } = req.body;
            
            // Si hay archivo, usamos su nombre, si no, null
            const logo = req.file ? req.file.filename : null;

            await ConfigModel.actualizar({
                nombre_empresa, ruc, direccion, telefono, email_contacto, moneda, logo
            });

            req.flash('mensajeExito', 'Configuración actualizada correctamente');
            res.redirect('/config');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar configuración');
            res.redirect('/config');
        }
    }
};

module.exports = configController;