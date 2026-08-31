const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const EmpenoModel = require('../models/EmpenoModel');
const AhorroModel = require('../models/AhorroModel');
const ConfigModel = require('../models/ConfigModel');

const clientesController = {

    // 1. Listar Clientes Registrados con Paginación y Búsqueda
    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let clientes;
            let totalRegistros;

            if (busqueda) {
                clientes = await ClienteModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = await ClienteModel.contarBusqueda(busqueda);
            } else {
                clientes = await ClienteModel.obtenerPaginados(limit, offset);
                totalRegistros = await ClienteModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);

            res.render('clientes/index', {
                title: 'Gestión de Clientes',
                clientes: clientes,
                busqueda: busqueda,
                currentPage: page,
                totalPages: totalPages,
                totalRegistros: totalRegistros
            });
        } catch (error) {
            console.error("Error al listar clientes:", error);
            req.flash('mensajeError', 'Error al cargar el listado de clientes');
            res.redirect('/');
        }
    },

    // 2. Mostrar Formulario de Creación
    mostrarCrear: async (req, res) => {
        try {
            res.render('clientes/crear', {
                title: 'Registrar Nuevo Cliente'
            });
        } catch (error) {
            console.error(error);
            res.redirect('/clientes');
        }
    },

    // 3. Guardar Cliente (Soporta 11 campos y las 4 fotos simultáneas)
    guardar: async (req, res) => {
        try {
            const { 
                dni, nombre, apellido, telefono, direccion, email,
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio 
            } = req.body;

            const fotosCargadas = req.files || [];
            const foto_1 = fotosCargadas[0] ? fotosCargadas[0].filename : null;
            const foto_2 = fotosCargadas[1] ? fotosCargadas[1].filename : null;
            const foto_3 = fotosCargadas[2] ? fotosCargadas[2].filename : null;
            const foto_4 = fotosCargadas[3] ? fotosCargadas[3].filename : null;

            if (!dni || !nombre || !apellido) {
                req.flash('mensajeError', 'DNI, Nombre y Apellido son obligatorios');
                return res.redirect('/clientes/crear');
            }

            const existe = await ClienteModel.buscarPorDNI(dni);
            if (existe) {
                req.flash('mensajeError', 'El cliente con ese DNI ya existe');
                return res.redirect('/clientes/crear');
            }

            await ClienteModel.crear({ 
                dni, nombre, apellido, telefono, direccion, email, 
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio,
                foto_1, foto_2, foto_3, foto_4 
            });

            req.flash('mensajeExito', 'Cliente registrado correctamente');
            res.redirect('/clientes');

        } catch (error) {
            console.error("Error crítico al guardar cliente:", error);
            req.flash('mensajeError', 'Error interno al guardar el cliente');
            res.redirect('/clientes/crear');
        }
    },

    // 4. Ver Perfil (AISLAMIENTO TOTAL DE MÓDULOS CONTRA CAÍDAS)
    verPerfil: async (req, res) => {
        const { id } = req.params;
        try {
            // Buscamos los datos brutos del cliente desde el modelo
            const rowsCliente = await ClienteModel.obtenerPorId(id);
            
            if (!rowsCliente || rowsCliente.length === 0) {
                req.flash('mensajeError', 'Cliente no encontrado en el sistema');
                return res.redirect('/clientes');
            }
            
            // Evaluamos si devuelve un arreglo o el objeto directo
            const clienteUnico = Array.isArray(rowsCliente) ? rowsCliente[0] : rowsCliente;

            // Inicializamos deudas y configuraciones vacías por seguridad
            let prestamos = [];
            let empenos = [];
            let cuentaAhorro = null;
            let config = null;

            // Bloques de contingencia individuales: si uno falla, no detiene a los demás
            try { 
                if (PrestamoModel && typeof PrestamoModel.obtenerPorCliente === 'function') {
                    prestamos = await PrestamoModel.obtenerPorCliente(id); 
                }
            } catch(e) { console.log("Nota: No se cargó PrestamoModel o la función no existe."); }

            try { 
                if (EmpenoModel && typeof EmpenoModel.obtenerPorCliente === 'function') {
                    empenos = await EmpenoModel.obtenerPorCliente(id); 
                }
            } catch(e) { console.log("Nota: No se cargó EmpenoModel o la función no existe."); }

            try { 
                if (AhorroModel && typeof AhorroModel.buscarPorCliente === 'function') {
                    cuentaAhorro = await AhorroModel.buscarPorCliente(id); 
                }
            } catch(e) { console.log("Nota: No se cargó AhorroModel o la función no existe."); }

            try { 
                if (ConfigModel && typeof ConfigModel.obtener === 'function') {
                    config = await ConfigModel.obtener(); 
                }
            } catch(e) { console.log("Nota: No se cargó la configuración empresarial."); }

            const empresaConfig = config || { moneda: '$' };

            res.render('clientes/perfil', {
                title: `Perfil de ${clienteUnico.nombre}`,
                cliente: clienteUnico,
                prestamos: prestamos || [],
                empenos: empenos || [],
                cuentaAhorro: cuentaAhorro,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error("Error crítico interno al cargar perfil de cliente:", error);
            req.flash('mensajeError', 'Error al cargar perfil en el servidor');
            res.redirect('/clientes');
        }
    },

    // 5. Mostrar Formulario de Edición
    mostrarEdicion: async (req, res) => {
        const { id } = req.params;
        try {
            const rowsCliente = await ClienteModel.obtenerPorId(id);
            if (!rowsCliente || rowsCliente.length === 0) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }
            const clienteUnico = Array.isArray(rowsCliente) ? rowsCliente[0] : rowsCliente;
            res.render('clientes/editar', {
                title: 'Editar Cliente',
                cliente: clienteUnico
            });
        } catch (error) {
            console.error(error);
            res.redirect('/clientes');
        }
    },

    // 6. Procesar Edición de Clientes
    actualizar: async (req, res) => {
        const { id } = req.params;
        try {
            const { 
                dni, nombre, apellido, telefono, direccion, email,
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio 
            } = req.body;

            const fotosCargadas = req.files || [];
            
            const datosActualizar = { 
                dni, nombre, apellido, telefono, direccion, email,
                negocio, direccion_negocio, cuenta_bcp, numero_yape, referencia_domicilio
            };

            if (fotosCargadas[0]) datosActualizar.foto_1 = fotosCargadas[0].filename;
            if (fotosCargadas[1]) datosActualizar.foto_2 = fotosCargadas[1].filename;
            if (fotosCargadas[2]) datosActualizar.foto_3 = fotosCargadas[2].filename;
            if (fotosCargadas[3]) datosActualizar.foto_4 = fotosCargadas[3].filename;

            await ClienteModel.actualizar(id, datosActualizar);
            req.flash('mensajeExito', 'Datos del cliente actualizados correctamente');
            res.redirect('/clientes');
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
            req.flash('mensajeError', 'Error al actualizar los datos');
            res.redirect(`/clientes/editar/${id}`);
        }
    }
};

module.exports = clientesController;
