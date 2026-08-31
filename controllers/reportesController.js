const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const PrestamoModel = require('../models/PrestamoModel');
const PagoModel = require('../models/PagoModel');
const ConfigModel = require('../models/ConfigModel');
const ClienteModel = require('../models/ClienteModel');
const AhorroModel = require('../models/AhorroModel');
const EmpenoModel = require('../models/EmpenoModel');
const ReporteAvanzadoModel = require('../models/ReporteAvanzadoModel');
const finance = require('../utils/finance');

const reportesController = {

    // 1. CONTRATO DE PRÉSTAMO
    generarContrato: async (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = await PrestamoModel.obtenerPorId(id);
            let config = await ConfigModel.obtener();
            
            if (!config) config = { nombre_empresa: 'EMPRESA', moneda: '$', ruc: '000000000' };
            const moneda = config.moneda;

            if (!prestamo) return res.redirect('/prestamos');

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Contrato_Prestamo_${id}.pdf`);
            doc.pipe(res);

            // LOGO
            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 50, 45, { width: 60 }); } catch(e){}
            }

            doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE PRÉSTAMO DE DINERO', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(`NRO OPERACIÓN: ${prestamo.id}`, { align: 'center' });
            doc.moveDown(2);

            // CUERPO
            doc.fontSize(11).font('Helvetica');
            doc.text(`En la ciudad, a los ${new Date(prestamo.fecha_inicio).toLocaleDateString()}, se celebra el presente contrato entre:`);
            doc.moveDown(1);

            // PARTES
            doc.font('Helvetica-Bold').text('EL ACREEDOR:', { underline: true });
            doc.font('Helvetica').text(`Empresa: ${config.nombre_empresa}`);
            doc.text(`RUC: ${config.ruc}`);
            doc.text(`Dirección: ${config.direccion || 'Oficina Principal'}`);
            doc.moveDown(1);

            doc.font('Helvetica-Bold').text('EL DEUDOR (CLIENTE):', { underline: true });
            doc.font('Helvetica').text(`Nombre: ${prestamo.nombre} ${prestamo.apellido}`);
            doc.text(`Documento de Identidad (DNI): ${prestamo.dni}`);
            doc.text(`Teléfono: ${prestamo.telefono || 'No registrado'}`);
            doc.moveDown(2);

            // CLÁUSULAS
            doc.font('Helvetica-Bold').text('CLÁUSULAS DEL CONTRATO:', { align: 'center' });
            doc.moveDown(1);

            doc.font('Helvetica-Bold').text('PRIMERO (DEL MONTO):', { continued: true });
            doc.font('Helvetica').text(` EL ACREEDOR entrega a EL DEUDOR la suma de ${moneda} ${parseFloat(prestamo.monto_prestado).toFixed(2)} en calidad de préstamo.`);
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('SEGUNDO (DE LA DEVOLUCIÓN):', { continued: true });
            doc.font('Helvetica').text(` EL DEUDOR se compromete a devolver la suma total de ${moneda} ${parseFloat(prestamo.monto_total).toFixed(2)}, la cual incluye capital e intereses.`);
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('TERCERO (FORMA DE PAGO):', { continued: true });
            doc.font('Helvetica').text(` El pago se realizará en ${prestamo.cuotas} cuotas con frecuencia ${prestamo.frecuencia.toUpperCase()}.`);
            doc.moveDown(3);

            // FIRMAS
            doc.y = 650;
            doc.text('__________________________', 50, doc.y);
            doc.text('__________________________', 350, doc.y);
            
            doc.font('Helvetica-Bold');
            doc.text('FIRMA DE ACREEDOR', 50, doc.y + 15);
            doc.text('FIRMA DE DEUDOR', 350, doc.y + 15);
            
            doc.font('Helvetica');
            doc.text(config.nombre_empresa, 50, doc.y + 30);
            doc.text(`${prestamo.nombre} ${prestamo.apellido}`, 350, doc.y + 30);
            doc.text(`DNI: ${prestamo.dni}`, 350, doc.y + 45);

            doc.end();

        } catch (error) { 
            console.error("Error PDF Contrato:", error); 
            res.redirect('/prestamos'); 
        }
    },

    // 2. TICKET DE PAGO
    generarTicket: async (req, res) => {
        const { id } = req.params;
        try {
            const pago = await PagoModel.obtenerDetalle(id);
            let config = await ConfigModel.obtener();
            const moneda = (config && config.moneda) ? config.moneda : '$';
            
            if (!pago) return res.redirect('/prestamos');

            const doc = new PDFDocument({ size: [226, 400], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Ticket_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } catch(e){}
            doc.fontSize(10).font('Helvetica-Bold').text((config.nombre_empresa || 'SISTEMA').toUpperCase(), { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            doc.fontSize(12).text(`TOTAL: ${moneda} ${parseFloat(pago.monto_pagado).toFixed(2)}`, { align: 'center' });
            doc.end();
        } catch (error) { res.redirect('/prestamos'); }
    },

    // 3. CRONOGRAMA PDF
    generarCronogramaPDF: async (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = await PrestamoModel.obtenerPorId(id);
            let config = await ConfigModel.obtener();
            const moneda = (config && config.moneda) ? config.moneda : '$';
            
            if (!prestamo) return res.redirect('/prestamos');

            const cronograma = finance.calcularCronograma(
                parseFloat(prestamo.monto_total), 
                prestamo.cuotas, 
                prestamo.frecuencia, 
                prestamo.fecha_inicio
            );

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Cronograma_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 50, 40, { width: 50 }); } catch(e){}
            doc.fontSize(18).font('Helvetica-Bold').text('CRONOGRAMA DE PAGOS', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica');
            doc.text(`Cliente: ${prestamo.nombre} ${prestamo.apellido}`);
            
            let y = doc.y + 20;
            doc.text('Cuota | Fecha | Monto', 50, y);
            y += 20;
            cronograma.forEach(c => {
                doc.text(`${c.numero} | ${c.fecha.toLocaleDateString()} | ${moneda}${c.monto.toFixed(2)}`, 50, y);
                y += 15;
            });
            doc.end();
        } catch (error) { res.redirect('/prestamos'); }
    },

    // 4. ESTADO DE CUENTA INTEGRAL
    generarEstadoCuenta: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            const prestamos = await PrestamoModel.obtenerPorCliente(id);
            const ahorros = await AhorroModel.buscarPorCliente(id);
            const empenos = await EmpenoModel.obtenerPorCliente(id);
            let config = await ConfigModel.obtener();
            
            const moneda = (config && config.moneda) ? config.moneda : '$';
            if (!config) config = { nombre_empresa: 'Sistema', ruc: '' };

            if (!cliente) return res.redirect('/clientes');

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=EstadoCuenta_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 50, 45, { width: 60 }); } catch(e){}
            doc.fontSize(18).font('Helvetica-Bold').text('ESTADO DE CUENTA INTEGRAL', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(config.nombre_empresa, { align: 'center' });
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'center' });

            doc.y = 160;
            
            doc.rect(50, doc.y, 500, 70).fillAndStroke('#f8f9fa', '#dee2e6');
            const startY = doc.y; 
            doc.fill('#000').fontSize(12).font('Helvetica-Bold').text(`CLIENTE: ${cliente.nombre} ${cliente.apellido}`, 60, startY + 15);
            doc.fontSize(10).font('Helvetica').text(`DNI: ${cliente.dni}`, 60, startY + 35);
            
            doc.y = startY + 90;
            doc.font('Helvetica-Bold').fontSize(14).text('RESUMEN FINANCIERO', 50, doc.y);
            doc.moveDown(1);

            let y = doc.y;
            doc.fontSize(12).font('Helvetica-Bold').text('1. CUENTA DE AHORROS', 50, y);
            y += 20;
            doc.font('Helvetica');
            if (ahorros) {
                doc.fontSize(12).text(`Saldo Disponible: ${moneda} ${parseFloat(ahorros.saldo_actual).toFixed(2)}`, 50, y);
            } else {
                doc.fontSize(10).text('No tiene cuenta de ahorros activa.', 50, y);
            }
            y += 40;

            doc.font('Helvetica-Bold').fontSize(12).text('2. PRÉSTAMOS ACTIVOS', 50, y);
            y += 20;
            
            doc.fontSize(10).text('ID', 50, y);
            doc.text('Fecha', 100, y);
            doc.text('Monto Total', 220, y);
            doc.text('Estado', 350, y);
            doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke();
            y += 20;

            let totalDeuda = 0;
            let hayDeuda = false;
            doc.font('Helvetica');
            
            if (prestamos.length > 0) {
                prestamos.forEach(p => {
                    if(p.estado !== 'pagado') {
                        hayDeuda = true;
                        doc.text(`#${p.id}`, 50, y);
                        doc.text(new Date(p.fecha_inicio).toLocaleDateString(), 100, y);
                        doc.text(`${moneda} ${parseFloat(p.monto_total).toFixed(2)}`, 220, y);
                        doc.text(p.estado.toUpperCase(), 350, y);
                        y += 15;
                        totalDeuda += parseFloat(p.monto_total);
                    }
                });
            }
            if(!hayDeuda) {
                doc.text('Sin deudas pendientes.', 50, y);
                y += 20;
            } else {
                y += 10;
                doc.font('Helvetica-Bold').text(`Total Deuda: ${moneda} ${totalDeuda.toFixed(2)}`, 50, y);
                y += 20;
            }
            y += 20;

            if (y > 650) { doc.addPage(); y = 50; }
            doc.font('Helvetica-Bold').fontSize(12).text('3. ARTÍCULOS EN GARANTÍA', 50, y);
            y += 20;
            
            if (empenos.length > 0) {
                let hay = false;
                doc.font('Helvetica').fontSize(10);
                empenos.forEach(e => {
                    if(e.estado === 'en_custodia') {
                        hay = true;
                        doc.text(`- ${e.nombre_articulo} (${moneda} ${e.valor_tasacion})`, 50, y);
                        y += 15;
                    }
                });
                if(!hay) doc.text('No hay artículos en custodia.', 50, y);
            } else {
                doc.font('Helvetica').fontSize(10).text('No hay historial.', 50, y);
            }
            doc.end();
        } catch (error) { res.redirect('/clientes'); }
    },

    // 5. EXPORTAR EXCEL SIMPLE (BOTÓN VERDE) - ¡MEJORADO!
    exportarExcelPrestamos: async (req, res) => {
        try {
            const prestamos = await PrestamoModel.obtenerTodos();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte de Préstamos');

            // Definimos columnas completas
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Cliente', key: 'cliente', width: 30 },
                { header: 'DNI', key: 'dni', width: 15 },
                { header: 'Monto Prestado', key: 'monto', width: 15 },
                { header: 'Interés (%)', key: 'interes', width: 15 },
                { header: 'Total a Pagar', key: 'total', width: 15 },
                { header: 'Fecha Inicio', key: 'fecha', width: 15 },
                { header: 'Cuotas', key: 'cuotas', width: 10 },
                { header: 'Frecuencia', key: 'frecuencia', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 }
            ];

            // Estilo del encabezado
            worksheet.getRow(1).font = { bold: true };

            // Agregar filas
            prestamos.forEach(p => {
                worksheet.addRow({
                    id: p.id,
                    cliente: `${p.nombre} ${p.apellido}`,
                    dni: p.dni,
                    monto: parseFloat(p.monto_prestado),
                    interes: p.tasa_interes + '%',
                    total: parseFloat(p.monto_total),
                    fecha: new Date(p.fecha_inicio).toLocaleDateString(),
                    cuotas: p.cuotas,
                    frecuencia: p.frecuencia.toUpperCase(),
                    estado: p.estado.toUpperCase()
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Prestamos_Completo.xlsx');
            
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) { 
            console.error("Error Excel Simple:", error);
            res.redirect('/prestamos'); 
        }
    },

    // 6. MOSTRAR PANEL REPORTES
    mostrarPanel: (req, res) => { 
        res.render('reportes/panel', { title: 'Centro de Reportes' }); 
    },

    // 7. DESCARGAR REPORTE EXCEL (AVANZADO)
    descargarReporteExcel: async (req, res) => {
        const { tipo_reporte, fecha_inicio, fecha_fin } = req.body;
        
        console.log(`Generando Excel: ${tipo_reporte} de ${fecha_inicio} a ${fecha_fin}`);

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Datos Exportados');
            
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };

            let datos = [];

            if (tipo_reporte === 'prestamos') {
                datos = await ReporteAvanzadoModel.prestamosPorFecha(fecha_inicio, fecha_fin);
                worksheet.columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: 'Cliente', key: 'cliente', width: 30 },
                    { header: 'DNI', key: 'dni', width: 15 },
                    { header: 'Monto Prestado', key: 'monto', width: 15 },
                    { header: 'Fecha', key: 'fecha', width: 15 },
                    { header: 'Estado', key: 'estado', width: 15 }
                ];
                datos.forEach(d => {
                    worksheet.addRow({
                        id: d.id,
                        cliente: `${d.nombre} ${d.apellido}`,
                        dni: d.dni,
                        monto: d.monto_prestado,
                        fecha: new Date(d.fecha_inicio).toLocaleDateString(),
                        estado: d.estado.toUpperCase()
                    });
                });

            } else if (tipo_reporte === 'pagos') {
                datos = await ReporteAvanzadoModel.pagosPorFecha(fecha_inicio, fecha_fin);
                worksheet.columns = [
                    { header: 'ID Pago', key: 'id', width: 10 },
                    { header: 'Fecha', key: 'fecha', width: 20 },
                    { header: 'Cliente', key: 'cliente', width: 30 },
                    { header: 'Monto', key: 'monto', width: 15 }
                ];
                datos.forEach(d => {
                    worksheet.addRow({
                        id: d.id,
                        fecha: new Date(d.fecha_pago).toLocaleString(),
                        cliente: `${d.nombre} ${d.apellido}`,
                        monto: d.monto_pagado
                    });
                });

            } else if (tipo_reporte === 'gastos') {
                datos = await ReporteAvanzadoModel.gastosPorFecha(fecha_inicio, fecha_fin);
                worksheet.columns = [
                    { header: 'Fecha', key: 'fecha', width: 15 },
                    { header: 'Descripción', key: 'desc', width: 30 },
                    { header: 'Categoría', key: 'cat', width: 15 },
                    { header: 'Monto', key: 'monto', width: 15 }
                ];
                datos.forEach(d => {
                    worksheet.addRow({
                        fecha: new Date(d.fecha_gasto).toLocaleDateString(),
                        desc: d.descripcion,
                        cat: d.categoria,
                        monto: d.monto
                    });
                });
            }

            const fileName = `Reporte_${tipo_reporte}_${Date.now()}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Error generando Excel:", error);
            req.flash('mensajeError', 'Ocurrió un error al generar el reporte');
            res.redirect('/reportes/panel');
        }
    },

    // 8. TICKET AHORRO
    generarTicketAhorro: async (req, res) => {
        const { id } = req.params;
        try {
            const mov = await AhorroModel.obtenerMovimientoPorId(id);
            let config = await ConfigModel.obtener();
            
            const moneda = (config && config.moneda) ? config.moneda : '$';
            if (!config) config = { nombre_empresa: 'Sistema Financiero', ruc: '000000' };

            if (!mov) return res.redirect('/ahorros');

            const doc = new PDFDocument({ size: [226, 400], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Voucher_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } 
                catch(e) { doc.moveDown(2); }
            } else { doc.moveDown(2); }
            
            doc.fontSize(10).font('Helvetica-Bold').text(config.nombre_empresa.toUpperCase(), { align: 'center' });
            doc.fontSize(8).font('Helvetica').text(`RUC: ${config.ruc || '---'}`, { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').text('COMPROBANTE AHORRO', { align: 'center' });
            doc.text(`OP: ${mov.mov_id}`, { align: 'center' });
            doc.font('Helvetica').text(new Date(mov.fecha_movimiento).toLocaleString(), { align: 'center' });
            
            doc.moveDown(0.5);
            doc.text('--------------------------------', { align: 'center' });
            doc.font('Helvetica').text(`Cliente: ${mov.nombre} ${mov.apellido}`);
            doc.text(`DNI: ${mov.dni}`);
            doc.text(`Cuenta: #${mov.cuenta_id}`);
            
            doc.moveDown(1);
            doc.font('Helvetica-Bold').fontSize(14).text(mov.tipo_movimiento.toUpperCase(), { align: 'center' });
            doc.fontSize(16).text(`${moneda} ${parseFloat(mov.monto).toFixed(2)}`, { align: 'center' });
            
            doc.fontSize(8).font('Helvetica');
            if(mov.observacion) {
                doc.moveDown(0.5);
                doc.text(`Obs: ${mov.observacion}`, { align: 'center' });
            }

            doc.moveDown(2);
            doc.text('Verifique su dinero antes de retirarse.', { align: 'center' });
            
            doc.end();

        } catch (error) {
            console.error("Error en Ticket Ahorro:", error);
            res.redirect('/ahorros');
        }
    }
};

module.exports = reportesController;