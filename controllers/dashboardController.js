const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
    
    mostrarDashboard: async (req, res) => {
        try {
            // 1. Obtener totales
            const totales = await DashboardModel.obtenerTotales();

            // 2. Obtener datos para gráficos
            const datosGrafico = await DashboardModel.obtenerDatosGraficos();

            // Procesar datos para Chart.js
            let estados = { pendiente: 0, pagado: 0, vencido: 0 };
            
            datosGrafico.forEach(d => {
                estados[d.estado] = d.cantidad;
            });

            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: totales,
                graficos: {
                    estados: [estados.pendiente, estados.pagado, estados.vencido],
                    balance: [totales.totalPrestadoHistorico, totales.dineroCobrado]
                }
            });

        } catch (error) {
            console.error(error);
            // Fallback en caso de error
            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: { 
                    clientes: 0, 
                    dineroPrestado: 0, 
                    articulosEmpeno: 0, 
                    dineroCobrado: 0,
                    totalAhorros: 0 // <--- Agregamos esto para evitar errores
                },
                graficos: { estados: [0,0,0], balance: [0,0] }
            });
        }
    }
};

module.exports = dashboardController;