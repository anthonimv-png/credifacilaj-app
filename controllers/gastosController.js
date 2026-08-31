const GastoModel = require('../models/GastoModel');
const ConfigModel = require('../models/ConfigModel');
const BitacoraModel = require('../models/BitacoraModel'); // <--- 1. IMPORTAR BITÁCORA

const gastosController = {

    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let gastos;
            let totalRegistros;

            if (busqueda) {
                gastos = await GastoModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = await GastoModel.contarBusqueda(busqueda);
            } else {
                gastos = await GastoModel.obtenerPaginados(limit, offset);
                totalRegistros = await GastoModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);
            const config = await ConfigModel.obtener();
            const empresaConfig = config || { moneda: '$' };

            res.render('gastos/index', { 
                title: 'Gestión de Gastos',
                gastos: gastos,
                busqueda: busqueda,
                currentPage: page,
                totalPages: totalPages,
                totalRegistros: totalRegistros,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar gastos');
            res.redirect('/');
        }
    },

    guardar: async (req, res) => {
        try {
            const { descripcion, monto, categoria, observacion } = req.body;
            const registrado_por = (req.session.usuario && req.session.usuario.nombre) ? req.session.usuario.nombre : 'Administrador';

            if (!descripcion || !monto) {
                req.flash('mensajeError', 'Descripción y Monto son obligatorios');
                return res.redirect('/gastos');
            }

            // 1. Guardar el Gasto
            await GastoModel.crear({
                descripcion,
                monto: parseFloat(monto),
                categoria,
                registrado_por,
                observacion
            });

            // 2. REGISTRAR EN AUDITORÍA (NUEVO)
            await BitacoraModel.registrar(
                registrado_por, 
                'REGISTRAR_GASTO', 
                `Se registró gasto: ${descripcion} por un monto de ${monto} (${categoria})`
            );

            req.flash('mensajeExito', 'Gasto registrado correctamente');
            res.redirect('/gastos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al registrar el gasto');
            res.redirect('/gastos');
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;
        try {
            // Obtenemos usuario para la bitácora
            const usuario = (req.session.usuario && req.session.usuario.nombre) ? req.session.usuario.nombre : 'Administrador';

            // 1. Eliminar Gasto
            await GastoModel.eliminar(id);

            // 2. REGISTRAR EN AUDITORÍA (NUEVO)
            await BitacoraModel.registrar(
                usuario, 
                'ELIMINAR_GASTO', 
                `Se eliminó el gasto con ID: ${id}`
            );

            req.flash('mensajeExito', 'Gasto eliminado');
            res.redirect('/gastos');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al eliminar');
            res.redirect('/gastos');
        }
    }
};

module.exports = gastosController;