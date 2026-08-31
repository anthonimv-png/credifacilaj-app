const finance = {
    
    // Función para sumar días o meses a una fecha
    sumarFecha: (fecha, frecuencia) => {
        const nuevaFecha = new Date(fecha);
        // Ajustamos la zona horaria para evitar errores de día
        if (frecuencia === 'diario') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        } else if (frecuencia === 'semanal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 7);
        } else if (frecuencia === 'quincenal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 15);
        } else if (frecuencia === 'mensual') {
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
        }
        return nuevaFecha;
    },

    // Generar el array de cuotas
    calcularCronograma: (montoTotal, cuotas, frecuencia, fechaInicio) => {
        const listaCuotas = [];
        const montoCuota = montoTotal / cuotas;
        
        // La primera cuota suele ser un periodo DESPUÉS de la fecha de inicio
        let fechaActual = new Date(fechaInicio);
        fechaActual = finance.sumarFecha(fechaActual, frecuencia);

        for (let i = 1; i <= cuotas; i++) {
            listaCuotas.push({
                numero: i,
                fecha: new Date(fechaActual), // Copia de la fecha
                monto: montoCuota
            });

            // Avanzamos la fecha para la siguiente vuelta
            fechaActual = finance.sumarFecha(fechaActual, frecuencia);
        }

        return listaCuotas;
    }
};

module.exports = finance;