const BitacoraModel = require('../models/BitacoraModel');

const bitacoraController = {
    
    // Mostrar la pantalla de auditoría
    mostrar: async (req, res) => {
        try {
            // Obtenemos los últimos 100 movimientos
            const registros = await BitacoraModel.obtenerUltimos(100);
            
            res.render('bitacora/index', {
                title: 'Auditoría del Sistema',
                registros: registros
            });
        } catch (error) {
            console.error("Error cargando bitácora:", error);
            res.redirect('/');
        }
    }
};

module.exports = bitacoraController;