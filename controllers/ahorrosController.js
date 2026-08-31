const AhorroModel = require('../models/AhorroModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel'); // <--- Importamos Configuración
const emailService = require('../utils/emailService');

const ahorrosController = {

    // 1. Listar Cuentas
    listar: async (req, res) => {
        try {
            const cuentas = await AhorroModel.obtenerTodas();
            res.render('ahorros/index', { 
                title: 'Cuentas de Ahorro',
                cuentas: cuentas
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar cuentas');
            res.redirect('/');
        }
    },

    // 2. Aperturar cuenta
    aperturar: async (req, res) => {
        try {
            const todosClientes = await ClienteModel.obtenerTodos();
            res.render('ahorros/aperturar', {
                title: 'Nueva Cuenta de Ahorros',
                clientes: todosClientes
            });
        } catch (error) {
            console.error(error);
            res.redirect('/ahorros');
        }
    },

    // 3. Guardar nueva cuenta
    guardarCuenta: async (req, res) => {
        const { cliente_id } = req.body;
        try {
            const existe = await AhorroModel.buscarPorCliente(cliente_id);
            if (existe) {
                req.flash('mensajeError', 'Este cliente ya tiene una cuenta activa');
                return res.redirect('/ahorros/aperturar');
            }

            await AhorroModel.crear(cliente_id);
            req.flash('mensajeExito', 'Cuenta aperturada correctamente');
            res.redirect('/ahorros');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear cuenta');
            res.redirect('/ahorros');
        }
    },

    // 4. Ver Movimientos
    verCuenta: async (req, res) => {
        const { id } = req.params;
        try {
            const cuenta = await AhorroModel.obtenerPorId(id);
            if (!cuenta) return res.redirect('/ahorros');

            const movimientos = await AhorroModel.obtenerMovimientos(id);

            res.render('ahorros/ver', {
                title: 'Detalle de Cuenta',
                cuenta,
                movimientos
            });
        } catch (error) {
            console.error(error);
            res.redirect('/ahorros');
        }
    },

    // 5. Procesar Transacción (Con Moneda Sincronizada)
    procesarTransaccion: async (req, res) => {
        const { cuenta_id, tipo, monto, observacion } = req.body;
        
        try {
            const montoFloat = parseFloat(monto);
            if (montoFloat <= 0) {
                req.flash('mensajeError', 'El monto debe ser mayor a 0');
                return res.redirect(`/ahorros/ver/${cuenta_id}`);
            }

            const cuenta = await AhorroModel.obtenerPorId(cuenta_id);

            if (tipo === 'retiro' && montoFloat > parseFloat(cuenta.saldo_actual)) {
                req.flash('mensajeError', 'Saldo insuficiente para realizar el retiro');
                return res.redirect(`/ahorros/ver/${cuenta_id}`);
            }

            await AhorroModel.registrarMovimiento(cuenta_id, tipo, montoFloat, observacion);

            let nuevoSaldo = parseFloat(cuenta.saldo_actual);
            if(tipo === 'deposito') nuevoSaldo += montoFloat;
            else nuevoSaldo -= montoFloat;

            // --- ENVÍO DE CORREO ---
            if (cuenta.email) {
                // Obtenemos moneda
                let config = await ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';

                const html = emailService.plantillaAhorro(
                    `${cuenta.nombre} ${cuenta.apellido}`,
                    tipo,
                    montoFloat,
                    nuevoSaldo,
                    simboloMoneda // <--- Pasamos moneda
                );
                emailService.enviarCorreo(cuenta.email, `Notificación de ${tipo.toUpperCase()}`, html);
            }

            req.flash('mensajeExito', 'Transacción realizada con éxito');
            res.redirect(`/ahorros/ver/${cuenta_id}`);

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error en la transacción');
            res.redirect(`/ahorros/ver/${cuenta_id}`);
        }
    }
};

module.exports = ahorrosController;