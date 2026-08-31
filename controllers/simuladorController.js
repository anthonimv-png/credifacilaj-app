const finance = require('../utils/finance');

const simuladorController = {

    // 1. Mostrar la pantalla del simulador
    mostrar: (req, res) => {
        res.render('simulador/index', { 
            title: 'Calculadora de Préstamos',
            resultado: null, // Al inicio no hay resultados
            datos: {} // Para mantener los datos en el formulario
        });
    },

    // 2. Procesar el cálculo
    calcular: (req, res) => {
        const { monto, interes, cuotas, frecuencia } = req.body;

        // Validar datos básicos
        if (!monto || !interes || !cuotas) {
            req.flash('mensajeError', 'Complete todos los campos para calcular');
            return res.redirect('/simulador');
        }

        const montoPrestado = parseFloat(monto);
        const tasa = parseFloat(interes);
        const numCuotas = parseInt(cuotas);

        // Cálculo de Interés Simple
        const montoInteres = montoPrestado * (tasa / 100);
        const montoTotal = montoPrestado + montoInteres;

        // Generar Cronograma (Proyectado desde hoy)
        const cronograma = finance.calcularCronograma(
            montoTotal, 
            numCuotas, 
            frecuencia, 
            new Date() // Usamos fecha de hoy para la simulación
        );

        res.render('simulador/index', {
            title: 'Calculadora de Préstamos',
            resultado: {
                montoPrestado,
                tasa,
                montoTotal,
                montoInteres,
                cronograma
            },
            datos: req.body // Devolvemos lo que escribió el usuario para que no se borre
        });
    }
};

module.exports = simuladorController;