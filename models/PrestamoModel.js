const db = require('../config/db');

class PrestamoModel {

    // 1. Guardar préstamo (Soporta IDs individuales y grupales de forma segura)
    static async crear(datos) {
        const idCliente = datos.cliente_id ? datos.cliente_id : null;
        const idGrupo = datos.grupo_id ? datos.grupo_id : null;

        const query = `
            INSERT INTO prestamos 
            (cliente_id, grupo_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')
        `;
        
        const [result] = await db.query(query, [
            idCliente,
            idGrupo,
            datos.monto_prestado,
            datos.tasa_interes,
            datos.monto_total,
            datos.cuotas,
            datos.frecuencia,
            datos.fecha_inicio,
            datos.fecha_fin,
        ]);
        return result;
    }

    // 2. Obtener préstamos paginados con ESTADO CALCULADO EN VIVO contra deudas reales
    static async obtenerPaginados(limit, offset) {
        const query = `
            SELECT 
                p.id, p.cliente_id, p.grupo_id, p.monto_prestado, p.tasa_interes, p.monto_total, 
                p.cuotas, p.frecuencia, p.fecha_inicio, p.fecha_fin, p.monto_pagado,
                IF(COALESCE(p.monto_pagado, 0) >= p.monto_total, 'Pagado', 'Pendiente') AS estado,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.dni AS dni,
                g.nombre AS grupo_nombre
            FROM prestamos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(query, [limit, offset]);
        return rows;
    }

    // 3. Buscar préstamos con paginación y ESTADO CALCULADO EN VIVO
    static async buscarPaginados(busqueda, limit, offset) {
        const query = `
            SELECT 
                p.id, p.cliente_id, p.grupo_id, p.monto_prestado, p.tasa_interes, p.monto_total, 
                p.cuotas, p.frecuencia, p.fecha_inicio, p.fecha_fin, p.monto_pagado,
                IF(COALESCE(p.monto_pagado, 0) >= p.monto_total, 'Pagado', 'Pendiente') AS estado,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.dni AS dni,
                g.nombre AS grupo_nombre
            FROM prestamos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            WHERE LOWER(CONCAT(c.nombre, ' ', c.apellido)) LIKE ? 
               OR c.dni LIKE ? 
               OR g.nombre LIKE ?
               OR p.id = ?
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;
        const termino = `%${busqueda.toLowerCase()}%`;
        const idExacto = isNaN(busqueda) ? -1 : parseInt(busqueda);
        
        const [rows] = await db.query(query, [termino, termino, termino, idExacto, limit, offset]);
        return rows;
    }

    // 4. Contar total de registros generales en la tabla
    static async contarTotal() {
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM prestamos');
        return rows[0].total;
    }

    // 5. Contar total de registros dentro de un filtro de búsqueda
    static async contarBusqueda(busqueda) {
        const query = `
            SELECT COUNT(*) AS total 
            FROM prestamos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            WHERE LOWER(CONCAT(c.nombre, ' ', c.apellido)) LIKE ? 
               OR c.dni LIKE ? 
               OR g.nombre LIKE ?
               OR p.id = ?
        `;
        const termino = `%${busqueda.toLowerCase()}%`;
        const idExacto = isNaN(busqueda) ? -1 : parseInt(busqueda);

        const [rows] = await db.query(query, [termino, termino, termino, idExacto]);
        return rows[0].total;
    }

    // 6. Obtener préstamo específico por ID para el Cronograma con ESTADO CALCULADO
    static async obtenerPorId(id) {
        const query = `
            SELECT 
                p.id, p.cliente_id, p.grupo_id, p.monto_prestado, p.tasa_interes, p.monto_total, 
                p.cuotas, p.frecuencia, p.fecha_inicio, p.fecha_fin, p.monto_pagado,
                IF(COALESCE(p.monto_pagado, 0) >= p.monto_total, 'Pagado', 'Pendiente') AS estado,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.dni AS dni,
                g.nombre AS grupo_nombre
            FROM prestamos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            WHERE p.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    // 7. Reporte de Préstamos Vencidos (Morosidad) con soporte grupal y ESTADO CALCULADO
    static async obtenerVencidos() {
        const query = `
            SELECT 
                p.id, p.cliente_id, p.grupo_id, p.monto_prestado, p.tasa_interes, p.monto_total, 
                p.cuotas, p.frecuencia, p.fecha_inicio, p.fecha_fin, p.monto_pagado,
                IF(COALESCE(p.monto_pagado, 0) >= p.monto_total, 'Pagado', 'Pendiente') AS estado,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.dni AS dni,
                g.nombre AS grupo_nombre
            FROM prestamos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            WHERE COALESCE(p.monto_pagado, 0) < p.monto_total AND p.fecha_fin < CURDATE()
            ORDER BY p.fecha_fin ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    }
}

module.exports = PrestamoModel;
