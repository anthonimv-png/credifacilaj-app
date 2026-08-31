-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para sistema_prestamos
CREATE DATABASE IF NOT EXISTS `sistema_prestamos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema_prestamos`;

-- Volcando estructura para tabla sistema_prestamos.bitacora
CREATE TABLE IF NOT EXISTS `bitacora` (
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

-- Volcando datos para la tabla sistema_prestamos.bitacora: ~0 rows (aproximadamente)
DELETE FROM `bitacora`;
INSERT INTO `bitacora` (`id`, `usuario_id`, `accion`, `detalle`, `ip`, `fecha`) VALUES
	(1, 2, 'CREAR_GASTO', 'Registró gasto: pasaje 2 por $10', '::1', '2025-12-09 05:49:22');

-- Volcando estructura para tabla sistema_prestamos.clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `foto` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.clientes: ~0 rows (aproximadamente)
DELETE FROM `clientes`;
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `apellido`, `telefono`, `direccion`, `email`, `created_at`, `foto`) VALUES
	(1, '44444444', 'VICTOR CESAR', 'RAMOS', '12121212', '', 'victor.rs.datsoft@gmail.com', '2025-12-08 06:35:21', '1765299385810-427613926.jpg'),
	(2, '1010101010', 'VITO', 'RAMOS', '23232323', 'ICA', 'victor.rs.datsoft@outlook.es', '2025-12-09 18:25:44', '1765304744193-739679770.png');

-- Volcando estructura para tabla sistema_prestamos.configuracion
CREATE TABLE IF NOT EXISTS `configuracion` (
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

-- Volcando datos para la tabla sistema_prestamos.configuracion: ~1 rows (aproximadamente)
DELETE FROM `configuracion`;
INSERT INTO `configuracion` (`id`, `nombre_empresa`, `ruc`, `direccion`, `telefono`, `email_contacto`, `logo`, `moneda`) VALUES
	(1, 'Préstamos Pro', '00000000000', 'Calle Principal 123', '555-0000', 'contacto@empresa.com', '1765220162557-18539419.png', 'S/');

-- Volcando estructura para tabla sistema_prestamos.cuentas_ahorro
CREATE TABLE IF NOT EXISTS `cuentas_ahorro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `saldo_actual` decimal(12,2) DEFAULT '0.00',
  `fecha_apertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `cuentas_ahorro_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.cuentas_ahorro: ~0 rows (aproximadamente)
DELETE FROM `cuentas_ahorro`;
INSERT INTO `cuentas_ahorro` (`id`, `cliente_id`, `saldo_actual`, `fecha_apertura`) VALUES
	(1, 1, 3000.00, '2025-12-08 06:57:38'),
	(2, 2, 11.00, '2025-12-09 22:20:28');

-- Volcando estructura para tabla sistema_prestamos.empenos
CREATE TABLE IF NOT EXISTS `empenos` (
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.empenos: ~1 rows (aproximadamente)
DELETE FROM `empenos`;
INSERT INTO `empenos` (`id`, `cliente_id`, `nombre_articulo`, `descripcion`, `valor_tasacion`, `monto_prestado`, `fecha_limite`, `estado`, `created_at`, `imagen`) VALUES
	(1, 1, 'LAPTOP', 'descripción de prueba', 500.00, 300.00, '2026-01-07', 'en_custodia', '2025-12-08 06:44:03', NULL),
	(2, 1, 'NOTEBOOK', 'NOTEBOOK CASI NUEVA SOLO 2 MESES DE USO', 1500.00, 1000.00, '2026-01-07', 'en_custodia', '2025-12-08 18:45:53', '1765219553365-608749270.png');

-- Volcando estructura para tabla sistema_prestamos.gastos
CREATE TABLE IF NOT EXISTS `gastos` (
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

-- Volcando datos para la tabla sistema_prestamos.gastos: ~2 rows (aproximadamente)
DELETE FROM `gastos`;
INSERT INTO `gastos` (`id`, `descripcion`, `monto`, `categoria`, `fecha_gasto`, `usuario_id`, `created_at`, `registrado_por`, `observacion`) VALUES
	(1, 'pasaje ', 20.00, 'Otros', '2025-12-09', 2, '2025-12-09 05:08:56', 'Sistema', NULL),
	(2, 'pasaje 2', 10.00, 'Otros', '2025-12-09', 2, '2025-12-09 05:49:22', 'Sistema', NULL),
	(3, 'comida', 20.00, 'Otros', '2025-12-09', NULL, '2025-12-09 21:05:29', 'Administrador', 'prueba hoy'),
	(4, 'x', 10.00, 'Otros', '2025-12-09', NULL, '2025-12-09 21:22:33', 'Administrador', 's');

-- Volcando estructura para tabla sistema_prestamos.movimientos_ahorro
CREATE TABLE IF NOT EXISTS `movimientos_ahorro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cuenta_id` int NOT NULL,
  `tipo_movimiento` enum('deposito','retiro','interes_ganado') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` text,
  PRIMARY KEY (`id`),
  KEY `cuenta_id` (`cuenta_id`),
  CONSTRAINT `movimientos_ahorro_ibfk_1` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_ahorro` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.movimientos_ahorro: ~0 rows (aproximadamente)
DELETE FROM `movimientos_ahorro`;
INSERT INTO `movimientos_ahorro` (`id`, `cuenta_id`, `tipo_movimiento`, `monto`, `fecha_movimiento`, `observacion`) VALUES
	(1, 1, 'deposito', 1000.00, '2025-12-08 06:58:02', NULL),
	(2, 1, 'deposito', 2000.00, '2025-12-09 17:53:48', 'ahorros 2'),
	(3, 2, 'deposito', 11.00, '2025-12-09 22:20:43', '');

-- Volcando estructura para tabla sistema_prestamos.pagos
CREATE TABLE IF NOT EXISTS `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prestamo_id` int NOT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `fecha_pago` datetime DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `prestamo_id` (`prestamo_id`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.pagos: ~0 rows (aproximadamente)
DELETE FROM `pagos`;
INSERT INTO `pagos` (`id`, `prestamo_id`, `monto_pagado`, `fecha_pago`, `observaciones`) VALUES
	(1, 1, 1200.00, '2025-12-08 01:36:16', 'PAGADO'),
	(2, 2, 100.00, '2025-12-08 13:20:13', 'primer pago'),
	(3, 2, 150.00, '2025-12-09 00:16:41', 'segunda cuota');

-- Volcando estructura para tabla sistema_prestamos.prestamos
CREATE TABLE IF NOT EXISTS `prestamos` (
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
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.prestamos: ~4 rows (aproximadamente)
DELETE FROM `prestamos`;
INSERT INTO `prestamos` (`id`, `cliente_id`, `monto_prestado`, `tasa_interes`, `monto_total`, `cuotas`, `frecuencia`, `estado`, `fecha_inicio`, `fecha_fin`) VALUES
	(1, 1, 1000.00, 20.00, 1200.00, 10, 'mensual', 'pagado', '2025-12-08', '2026-10-08'),
	(2, 1, 500.00, 20.00, 600.00, 3, 'mensual', 'pendiente', '2025-12-08', '2026-03-08'),
	(3, 1, 700.00, 10.00, 770.00, 8, 'mensual', 'pendiente', '2025-12-09', '2026-08-09'),
	(4, 1, 200.00, 10.00, 220.00, 1, 'mensual', 'pendiente', '2025-12-09', '2026-01-09'),
	(5, 1, 400.00, 10.00, 440.00, 6, 'mensual', 'pendiente', '2025-12-09', '2026-06-09'),
	(6, 2, 7000.00, 10.00, 7700.00, 6, 'mensual', 'pendiente', '2025-12-09', '2026-06-09');

-- Volcando estructura para tabla sistema_prestamos.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','empleado') DEFAULT 'empleado',
  `estado` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.usuarios: ~1 rows (aproximadamente)
DELETE FROM `usuarios`;
INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password`, `rol`, `estado`, `created_at`) VALUES
	(2, 'Administrador', 'admin@sistema.com', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'admin', 1, '2025-12-08 17:55:23'),
	(3, 'usuario', 'usuario@sistema.com', '$2b$10$V4K5EWoiEyitaN8fxfYTguOsY3rJ/JXNvfZV/Y9t3jFWMGUB/1zwy', 'empleado', 1, '2025-12-09 05:21:28');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
