-- SCRIPT DE COPIA DE SEGURIDAD AUTOMÁTICA CREDIFACIL
-- Generado automáticamente: 27/8/2026, 3:46:30 p. m.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `bitacora`;
CREATE TABLE `bitacora` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(50) DEFAULT NULL,
  `detalle` text,
  `ip` varchar(50) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `bitacora_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `bitacora` (`id`, `usuario_id`, `accion`, `detalle`, `ip`, `fecha`) VALUES (1, 2, 'CREAR_GASTO', 'Registró gasto: pasaje 2 por $10', '::1', 'Tue Dec 09 2025 00:49:22 GMT-0500 (hora estándar de Perú)');

DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `foto` varchar(255) DEFAULT NULL,
  `negocio` varchar(150) DEFAULT NULL,
  `direccion_negocio` varchar(255) DEFAULT NULL,
  `cuenta_bcp` varchar(50) DEFAULT NULL,
  `numero_yape` varchar(20) DEFAULT NULL,
  `foto_1` varchar(255) DEFAULT NULL,
  `foto_2` varchar(255) DEFAULT NULL,
  `foto_3` varchar(255) DEFAULT NULL,
  `referencia_domicilio` varchar(255) DEFAULT NULL,
  `foto_4` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `clientes` (`id`, `dni`, `nombre`, `apellido`, `telefono`, `direccion`, `email`, `created_at`, `foto`, `negocio`, `direccion_negocio`, `cuenta_bcp`, `numero_yape`, `foto_1`, `foto_2`, `foto_3`, `referencia_domicilio`, `foto_4`) VALUES (1, '45814296', 'anthoni', 'mendoza vilela', '972370159', 'jr.tumbes 208', 'anthonimv@gmail.com', 'Wed Aug 26 2026 12:18:12 GMT-0500 (hora estándar de Perú)', NULL, 'bodega', 'jr. tumbes', '66666666666666', '972370159', 'cliente-1787764692856-365267431.png', 'cliente-1787764692870-176897056.png', 'cliente-1787764692878-888304302.jpeg', 'frente al parque', 'cliente-1787764692900-436415628.png');

DROP TABLE IF EXISTS `cobranzas`;
CREATE TABLE `cobranzas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prestamo_id` int DEFAULT NULL,
  `grupo_id` int DEFAULT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `num_cuota_pagada` int NOT NULL,
  `fecha_pago` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `metodo_pago` varchar(50) DEFAULT 'Efectivo',
  PRIMARY KEY (`id`),
  KEY `prestamo_id` (`prestamo_id`),
  KEY `grupo_id` (`grupo_id`),
  CONSTRAINT `cobranzas_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cobranzas_ibfk_2` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `configuracion`;
CREATE TABLE `configuracion` (
  `id` int NOT NULL,
  `nombre_empresa` varchar(100) DEFAULT 'Mi Financiera',
  `ruc` varchar(20) DEFAULT '00000000000',
  `direccion` varchar(255) DEFAULT 'Dirección Principal',
  `telefono` varchar(50) DEFAULT '555-0000',
  `email_contacto` varchar(100) DEFAULT 'contacto@empresa.com',
  `logo` varchar(255) DEFAULT NULL,
  `moneda` varchar(5) DEFAULT '$',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `configuracion` (`id`, `nombre_empresa`, `ruc`, `direccion`, `telefono`, `email_contacto`, `logo`, `moneda`) VALUES (1, 'CREDIFACIL A&J', '00000000000', 'CALLE. LOS DIAMANTES MZ E PRIMA LOTE 02-TUMBES', '972370159', 'credifacilaj@gmail.com', '1787764037714-499446496.jpeg', 'S/');

DROP TABLE IF EXISTS `cuentas_ahorro`;
CREATE TABLE `cuentas_ahorro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `saldo_actual` decimal(12,2) DEFAULT '0.00',
  `fecha_apertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `cuentas_ahorro_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `empenos`;
CREATE TABLE `empenos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `nombre_articulo` varchar(100) NOT NULL,
  `descripcion` text,
  `valor_tasacion` decimal(10,2) NOT NULL,
  `monto_prestado` decimal(10,2) NOT NULL,
  `fecha_limite` date NOT NULL,
  `estado` enum('en_custodia','retirado','perdido','vendido') DEFAULT 'en_custodia',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `imagen` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `empenos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `gastos`;
CREATE TABLE `gastos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `fecha_gasto` date NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` varchar(100) DEFAULT 'Sistema',
  `observacion` text,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `gastos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `grupos`;
CREATE TABLE `grupos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `grupo_clientes`;
CREATE TABLE `grupo_clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grupo_id` int DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `rol` enum('Líder','Clienta') DEFAULT 'Clienta',
  PRIMARY KEY (`id`),
  KEY `grupo_id` (`grupo_id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `grupo_clientes_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grupo_clientes_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `movimientos_ahorro`;
CREATE TABLE `movimientos_ahorro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cuenta_id` int NOT NULL,
  `tipo_movimiento` enum('deposito','retiro','interes_ganado') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` text,
  PRIMARY KEY (`id`),
  KEY `cuenta_id` (`cuenta_id`),
  CONSTRAINT `movimientos_ahorro_ibfk_1` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_ahorro` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pagos`;
CREATE TABLE `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prestamo_id` int NOT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `fecha_pago` datetime DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `prestamo_id` (`prestamo_id`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `prestamos`;
CREATE TABLE `prestamos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `monto_prestado` decimal(10,2) NOT NULL,
  `tasa_interes` decimal(5,2) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cuotas` int NOT NULL,
  `frecuencia` enum('diario','semanal','mensual') NOT NULL,
  `estado` enum('pendiente','pagado','vencido') DEFAULT 'pendiente',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `grupo_id` int DEFAULT NULL,
  `monto_pagado` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `prestamos` (`id`, `cliente_id`, `monto_prestado`, `tasa_interes`, `monto_total`, `cuotas`, `frecuencia`, `estado`, `fecha_inicio`, `fecha_fin`, `grupo_id`, `monto_pagado`) VALUES (1, 1, '1000.00', '16.00', '1160.00', 4, 'semanal', 'pendiente', 'Wed Aug 26 2026 00:00:00 GMT-0500 (hora estándar de Perú)', 'Wed Sep 23 2026 00:00:00 GMT-0500 (hora estándar de Perú)', NULL, '0.00');

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','empleado') DEFAULT 'empleado',
  `estado` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password`, `rol`, `estado`, `created_at`) VALUES (2, 'Administrador', 'admin@sistema.com', '$2b$10$fMWQOUOUhiKatx2wHdhM6OhfFmxCm3JA3ObOpvRaIqY7QT5Q.9sku', 'admin', 1, 'Mon Dec 08 2025 12:55:23 GMT-0500 (hora estándar de Perú)');
INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password`, `rol`, `estado`, `created_at`) VALUES (4, 'empleado1', 'asesor1@sistema.com', '$2b$10$NzEt36blkKaJt1k/XGxLfeq1jvrUIssa2PAK8M5mcHRWo.UQdZbR.', 'empleado', 1, 'Tue Aug 25 2026 00:08:56 GMT-0500 (hora estándar de Perú)');
INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password`, `rol`, `estado`, `created_at`) VALUES (5, 'asesor', 'asesor@sistema.com', '$2b$10$x2v6z0APPQboP/UOisbdxeGfe/uPhtpUOnrpxs1Zs7McOa0yoxsy.', 'empleado', 1, 'Thu Aug 27 2026 12:03:29 GMT-0500 (hora estándar de Perú)');

SET FOREIGN_KEY_CHECKS = 1;
