-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-11-2026 a las 20:59:50
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `aero_gestion_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_tripulacion`
--

CREATE TABLE `asignacion_tripulacion` (
  `id_vuelo` int(11) NOT NULL,
  `id_tripulante` int(11) NOT NULL,
  `rol_en_vuelo` varchar(50) NOT NULL DEFAULT 'Sobrecargo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `aviones`
--

CREATE TABLE `aviones` (
  `id_avion` int(11) NOT NULL,
  `matricula` varchar(20) NOT NULL,
  `modelo` varchar(50) NOT NULL,
  `capacidad_pasajeros` int(11) NOT NULL CHECK (`capacidad_pasajeros` > 0),
  `id_base_mantenimiento` int(11) NOT NULL,
  `estado` enum('OPERATIVO','EN_MANTENIMIENTO','FUERA_SERVICIO') DEFAULT 'OPERATIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `aviones`
--

INSERT INTO `aviones` (`id_avion`, `matricula`, `modelo`, `capacidad_pasajeros`, `id_base_mantenimiento`, `estado`) VALUES
(1, 'HK-5340', 'Boeing 737-800', 189, 1, 'OPERATIVO'),
(2, 'HK-4982', 'Airbus A320neo', 180, 2, 'OPERATIVO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bases`
--

CREATE TABLE `bases` (
  `id_base` int(11) NOT NULL,
  `codigo_iata` varchar(3) NOT NULL,
  `nombre_ciudad` varchar(100) NOT NULL,
  `nombre_aeropuerto` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bases`
--

INSERT INTO `bases` (`id_base`, `codigo_iata`, `nombre_ciudad`, `nombre_aeropuerto`) VALUES
(1, 'BOG', 'Bogotá', 'Aeropuerto Internacional El Dorado'),
(2, 'MDE', 'Medellín', 'Aeropuerto Internacional José María Córdova'),
(3, 'CLO', 'Cali', 'Aeropuerto Internacional Alfonso Bonilla Aragón');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id_persona` int(11) NOT NULL,
  `cedula_identidad` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `id_base_regreso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `personas`
--

INSERT INTO `personas` (`id_persona`, `cedula_identidad`, `nombres`, `apellidos`, `telefono`, `direccion`, `id_base_regreso`) VALUES
(1, '100100100', 'Santiago', 'Administrador', '3001234567', 'Calle 26 # 103-09', 1),
(2, '200200200', 'Carlos', 'Piloto Gómez', '3109876543', 'Av. El Dorado # 80', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pilotos`
--

CREATE TABLE `pilotos` (
  `id_persona` int(11) NOT NULL,
  `licencia_numero` varchar(50) NOT NULL,
  `horas_vuelo` int(11) NOT NULL DEFAULT 0 CHECK (`horas_vuelo` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pilotos`
--

INSERT INTO `pilotos` (`id_persona`, `licencia_numero`, `horas_vuelo`) VALUES
(2, 'ATPL-98234', 3200);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`, `descripcion`) VALUES
(1, 'ADMINISTRADOR', 'Acceso total y gestión de usuarios y flota'),
(2, 'PILOTO', 'Consulta de vuelos asignados y horas de vuelo'),
(3, 'TRIPULANTE', 'Consulta de agenda de vuelos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tripulantes`
--

CREATE TABLE `tripulantes` (
  `id_persona` int(11) NOT NULL,
  `rango` varchar(50) NOT NULL,
  `certificado_medico` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `token_recuperacion` varchar(100) DEFAULT NULL,
  `expiracion_token` datetime DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO','BLOQUEADO') DEFAULT 'ACTIVO',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `id_persona`, `email`, `password_hash`, `id_rol`, `token_recuperacion`, `expiracion_token`, `estado`, `created_at`) VALUES
(1, 1, 'admin@skyops.com', '$2b$10$riL03fgcS7M5wJ/Qos6RKOcshWjLJW0CJ46PcgVjmKTtYXEdrLMt2', 1, NULL, NULL, 'ACTIVO', '2026-10-22 15:09:29'),
(2, 2, 'piloto@skyops.com', '$2b$10$riL03fgcS7M5wJ/Qos6RKOcshWjLJW0CJ46PcgVjmKTtYXEdrLMt2', 2, NULL, NULL, 'ACTIVO', '2026-10-22 15:09:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vuelos`
--

CREATE TABLE `vuelos` (
  `id_vuelo` int(11) NOT NULL,
  `codigo_vuelo` varchar(20) NOT NULL,
  `id_origen` int(11) NOT NULL,
  `id_destino` int(11) NOT NULL,
  `fecha_salida` date NOT NULL,
  `hora_salida` time NOT NULL,
  `fecha_llegada` date NOT NULL,
  `hora_llegada` time NOT NULL,
  `id_avion` int(11) NOT NULL,
  `id_piloto` int(11) NOT NULL,
  `estado` enum('PROGRAMADO','EN_VUELO','COMPLETADO','CANCELADO') DEFAULT 'PROGRAMADO'
) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asignacion_tripulacion`
--
ALTER TABLE `asignacion_tripulacion`
  ADD PRIMARY KEY (`id_vuelo`,`id_tripulante`),
  ADD KEY `id_tripulante` (`id_tripulante`);

--
-- Indices de la tabla `aviones`
--
ALTER TABLE `aviones`
  ADD PRIMARY KEY (`id_avion`),
  ADD UNIQUE KEY `matricula` (`matricula`),
  ADD KEY `id_base_mantenimiento` (`id_base_mantenimiento`);

--
-- Indices de la tabla `bases`
--
ALTER TABLE `bases`
  ADD PRIMARY KEY (`id_base`),
  ADD UNIQUE KEY `codigo_iata` (`codigo_iata`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `cedula_identidad` (`cedula_identidad`),
  ADD KEY `id_base_regreso` (`id_base_regreso`);

--
-- Indices de la tabla `pilotos`
--
ALTER TABLE `pilotos`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `licencia_numero` (`licencia_numero`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tripulantes`
--
ALTER TABLE `tripulantes`
  ADD PRIMARY KEY (`id_persona`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `id_persona` (`id_persona`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_rol` (`id_rol`);

--
-- Indices de la tabla `vuelos`
--
ALTER TABLE `vuelos`
  ADD PRIMARY KEY (`id_vuelo`),
  ADD KEY `id_origen` (`id_origen`),
  ADD KEY `id_destino` (`id_destino`),
  ADD KEY `id_avion` (`id_avion`),
  ADD KEY `id_piloto` (`id_piloto`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `aviones`
--
ALTER TABLE `aviones`
  MODIFY `id_avion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `bases`
--
ALTER TABLE `bases`
  MODIFY `id_base` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `vuelos`
--
ALTER TABLE `vuelos`
  MODIFY `id_vuelo` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asignacion_tripulacion`
--
ALTER TABLE `asignacion_tripulacion`
  ADD CONSTRAINT `asignacion_tripulacion_ibfk_1` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `asignacion_tripulacion_ibfk_2` FOREIGN KEY (`id_tripulante`) REFERENCES `tripulantes` (`id_persona`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `aviones`
--
ALTER TABLE `aviones`
  ADD CONSTRAINT `aviones_ibfk_1` FOREIGN KEY (`id_base_mantenimiento`) REFERENCES `bases` (`id_base`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `personas`
--
ALTER TABLE `personas`
  ADD CONSTRAINT `personas_ibfk_1` FOREIGN KEY (`id_base_regreso`) REFERENCES `bases` (`id_base`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `pilotos`
--
ALTER TABLE `pilotos`
  ADD CONSTRAINT `pilotos_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `tripulantes`
--
ALTER TABLE `tripulantes`
  ADD CONSTRAINT `tripulantes_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `vuelos`
--
ALTER TABLE `vuelos`
  ADD CONSTRAINT `vuelos_ibfk_1` FOREIGN KEY (`id_origen`) REFERENCES `bases` (`id_base`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vuelos_ibfk_2` FOREIGN KEY (`id_destino`) REFERENCES `bases` (`id_base`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vuelos_ibfk_3` FOREIGN KEY (`id_avion`) REFERENCES `aviones` (`id_avion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vuelos_ibfk_4` FOREIGN KEY (`id_piloto`) REFERENCES `pilotos` (`id_persona`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
