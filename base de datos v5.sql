-- MySQL Workbench Forward Engineering
-- Base de Datos v5 - Sistema de Titulación UIDE
-- Mejoras: Normalización, Estandarización de Nombres, Corrección de PKs/FKs

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema db_proyecto_titulacion
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `db_proyecto_titulacion` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `db_proyecto_titulacion` ;

-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cedula` VARCHAR(15) NOT NULL,
  `nombres` VARCHAR(191) NOT NULL,
  `apellidos` VARCHAR(191) NOT NULL,
  `correo_institucional` VARCHAR(191) NOT NULL,
  `rol` ENUM('ESTUDIANTE', 'TUTOR', 'DIRECTOR', 'COORDINADOR', 'COMITE', 'DOCENTE_INTEGRACION') NOT NULL DEFAULT 'ESTUDIANTE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `usuarios_cedula_key` (`cedula` ASC) VISIBLE,
  UNIQUE INDEX `usuarios_correo_institucional_key` (`correo_institucional` ASC) VISIBLE
) ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`areas_conocimiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`areas_conocimiento` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(191) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `areas_conocimiento_codigo_key` (`codigo` ASC) VISIBLE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`propuestas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`propuestas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(191) NOT NULL,
  `objetivos` TEXT NOT NULL,
  `problematica` TEXT NULL DEFAULT NULL,
  `area_conocimiento_id` INT NOT NULL,
  `alcance` VARCHAR(191) NULL DEFAULT NULL,
  `archivo_url` VARCHAR(191) NULL DEFAULT NULL,
  `fecha_publicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `estado` ENUM('PENDIENTE', 'APROBADA', 'APROBADA_CON_COMENTARIOS', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  `fk_estudiante` INT NOT NULL,
  `fecha_defensa` DATETIME(3) NULL DEFAULT NULL,
  `resultado_defensa` ENUM('APROBADO', 'REPROBADO', 'PENDIENTE') NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id`),
  INDEX `propuestas_fk_estudiante_fkey` (`fk_estudiante` ASC) VISIBLE,
  INDEX `propuestas_area_conocimiento_id_fkey` (`area_conocimiento_id` ASC) VISIBLE,
  CONSTRAINT `propuestas_fk_estudiante_fkey`
    FOREIGN KEY (`fk_estudiante`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `propuestas_area_conocimiento_id_fkey`
    FOREIGN KEY (`area_conocimiento_id`)
    REFERENCES `db_proyecto_titulacion`.`areas_conocimiento` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`trabajo_titulacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`trabajo_titulacion` (
  `propuestas_id` INT NOT NULL,
  `fk_tutor_id` INT NOT NULL,
  PRIMARY KEY (`propuestas_id`, `fk_tutor_id`),
  INDEX `fk_propuestas_has_usuarios_usuarios1_idx` (`fk_tutor_id` ASC) VISIBLE,
  INDEX `fk_propuestas_has_usuarios_propuestas1_idx` (`propuestas_id` ASC) VISIBLE,
  CONSTRAINT `fk_propuestas_has_usuarios_propuestas1`
    FOREIGN KEY (`propuestas_id`)
    REFERENCES `db_proyecto_titulacion`.`propuestas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_propuestas_has_usuarios_usuarios1`
    FOREIGN KEY (`fk_tutor_id`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`actividades`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`actividades` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(191) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `propuesta_id` INT NOT NULL,
  `tipo` ENUM('DOCENCIA', 'TUTORIA') NOT NULL DEFAULT 'DOCENCIA',
  PRIMARY KEY (`id`),
  INDEX `actividades_propuesta_id_fkey` (`propuesta_id` ASC) VISIBLE,
  CONSTRAINT `actividades_propuesta_id_fkey`
    FOREIGN KEY (`propuesta_id`)
    REFERENCES `db_proyecto_titulacion`.`propuestas` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`auth`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`auth` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `usuario_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `auth_username_key` (`username` ASC) VISIBLE,
  UNIQUE INDEX `auth_usuario_id_key` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `auth_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`mcp_auth`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`mcp_auth` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `codigo` VARCHAR(6) NOT NULL,
  `token` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `mcp_auth_email_idx` (`email` ASC) VISIBLE,
  INDEX `mcp_auth_token_idx` (`token` ASC) VISIBLE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = 'Tabla para autenticación MCP: almacena códigos de verificación y tokens de sesión';


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`evidencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`evidencia` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `semana` INT NOT NULL,
  `contenido` TEXT NOT NULL,
  `archivo_url` VARCHAR(191) NULL DEFAULT NULL,
  `fecha_entrega` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `estado` ENUM('ENTREGADO', 'NO_ENTREGADO') NOT NULL DEFAULT 'ENTREGADO',
  `calificacion` DECIMAL(4,2) NULL DEFAULT NULL,
  `actividad_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `evidencia_actividad_id_fkey` (`actividad_id` ASC) VISIBLE,
  CONSTRAINT `evidencia_actividad_id_fkey`
    FOREIGN KEY (`actividad_id`)
    REFERENCES `db_proyecto_titulacion`.`actividades` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`comentarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`comentarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `evidencia_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `comentarios_evidencia_id_fkey` (`evidencia_id` ASC) VISIBLE,
  INDEX `comentarios_usuario_id_fkey` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `comentarios_evidencia_id_fkey`
    FOREIGN KEY (`evidencia_id`)
    REFERENCES `db_proyecto_titulacion`.`evidencia` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `comentarios_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`comite`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`comite` (
  `usuario_id` INT NOT NULL,
  `rol` ENUM('Jurado 1', 'Jurado 2', 'Presidente') NOT NULL,
  `calificacion` DECIMAL(4,2) NULL DEFAULT NULL,
  `fecha_asignada` DATE NULL DEFAULT NULL,
  `trabajo_titulacion_propuestas_id` INT NOT NULL,
  PRIMARY KEY (`usuario_id`, `trabajo_titulacion_propuestas_id`),
  INDEX `fk_comite_trabajo_titulacion1_idx` (`trabajo_titulacion_propuestas_id` ASC) VISIBLE,
  CONSTRAINT `comite_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comite_trabajo_titulacion1`
    FOREIGN KEY (`trabajo_titulacion_propuestas_id`)
    REFERENCES `db_proyecto_titulacion`.`trabajo_titulacion` (`propuestas_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`entregables_finales`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`entregables_finales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo` ENUM('TESIS', 'MANUAL_USUARIO', 'REPOSITORIO', 'ARTICULO') NOT NULL,
  `url_archivo` VARCHAR(255) NOT NULL,
  `fecha_subida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `propuestas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `entregables_finales_propuestas_id_fkey` (`propuestas_id` ASC) VISIBLE,
  CONSTRAINT `entregables_finales_propuestas_id_fkey`
    FOREIGN KEY (`propuestas_id`)
    REFERENCES `db_proyecto_titulacion`.`propuestas` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`estudiantes_perfil`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`estudiantes_perfil` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sexo` VARCHAR(20) NULL DEFAULT NULL,
  `estado_escuela` VARCHAR(50) NULL DEFAULT NULL,
  `sede` VARCHAR(100) NULL DEFAULT NULL,
  `escuela` VARCHAR(100) NULL DEFAULT NULL,
  `codigo_malla` VARCHAR(50) NULL DEFAULT NULL,
  `malla` VARCHAR(100) NULL DEFAULT NULL,
  `periodo_lectivo` VARCHAR(100) NULL DEFAULT NULL,
  `ciudad` VARCHAR(100) NULL DEFAULT NULL,
  `provincia` VARCHAR(100) NULL DEFAULT NULL,
  `pais` VARCHAR(100) NULL DEFAULT NULL,
  `usuario_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `estudiantes_perfil_usuario_id_key` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `estudiantes_perfil_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`notificaciones`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`notificaciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mensaje` TEXT NOT NULL,
  `leido` TINYINT(1) NOT NULL DEFAULT '0',
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `usuario_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `notificaciones_usuario_id_fkey` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `notificaciones_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`catalogo_prerequisitos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`catalogo_prerequisitos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(191) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `orden` INT NOT NULL DEFAULT 1,
  `activo` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `db_proyecto_titulacion`.`estudiante_prerequisitos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`estudiante_prerequisitos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `prerequisito_id` INT NOT NULL,
  `cumplido` TINYINT(1) NOT NULL DEFAULT '0',
  `archivo_url` VARCHAR(191) NULL DEFAULT NULL,
  `fecha_cumplimiento` DATETIME(3) NULL DEFAULT NULL,
  `fk_estudiante` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `estudiante_prerequisitos_fk_estudiante_fkey` (`fk_estudiante` ASC) VISIBLE,
  INDEX `estudiante_prerequisitos_prerequisito_id_fkey` (`prerequisito_id` ASC) VISIBLE,
  UNIQUE INDEX `estudiante_prerequisito_unique` (`fk_estudiante`, `prerequisito_id`) VISIBLE,
  CONSTRAINT `estudiante_prerequisitos_fk_estudiante_fkey`
    FOREIGN KEY (`fk_estudiante`)
    REFERENCES `db_proyecto_titulacion`.`usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `estudiante_prerequisitos_prerequisito_id_fkey`
    FOREIGN KEY (`prerequisito_id`)
    REFERENCES `db_proyecto_titulacion`.`catalogo_prerequisitos` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

USE `db_proyecto_titulacion` ;

-- -----------------------------------------------------
-- Placeholder table for view `db_proyecto_titulacion`.`v_usuarios_rls`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_proyecto_titulacion`.`v_usuarios_rls` (`id` INT, `cedula` INT, `nombres` INT, `apellidos` INT, `correo_institucional` INT, `rol` INT, `created_at` INT, `updated_at` INT);

-- -----------------------------------------------------
-- function get_app_role
-- -----------------------------------------------------

DELIMITER $$
USE `db_proyecto_titulacion`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `get_app_role`() RETURNS varchar(50) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    READS SQL DATA
    DETERMINISTIC
BEGIN
    RETURN @app_current_role;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- View `db_proyecto_titulacion`.`v_usuarios_rls`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_proyecto_titulacion`.`v_usuarios_rls`;
USE `db_proyecto_titulacion`;
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `db_proyecto_titulacion`.`v_usuarios_rls` AS 
SELECT 
  `db_proyecto_titulacion`.`usuarios`.`id` AS `id`,
  `db_proyecto_titulacion`.`usuarios`.`cedula` AS `cedula`,
  `db_proyecto_titulacion`.`usuarios`.`nombres` AS `nombres`,
  `db_proyecto_titulacion`.`usuarios`.`apellidos` AS `apellidos`,
  `db_proyecto_titulacion`.`usuarios`.`correo_institucional` AS `correo_institucional`,
  `db_proyecto_titulacion`.`usuarios`.`rol` AS `rol`,
  `db_proyecto_titulacion`.`usuarios`.`created_at` AS `created_at`,
  `db_proyecto_titulacion`.`usuarios`.`updated_at` AS `updated_at` 
FROM `db_proyecto_titulacion`.`usuarios` 
WHERE (`get_app_role`() = 'DIRECTOR');

-- -----------------------------------------------------
-- Datos iniciales: Áreas de Conocimiento
-- -----------------------------------------------------
INSERT INTO `db_proyecto_titulacion`.`areas_conocimiento` (`codigo`, `nombre`, `descripcion`) VALUES
('CDIA', 'Ciencia de Datos e Inteligencia Artificial', 'Proyectos relacionados con análisis de datos, machine learning, deep learning y sistemas inteligentes'),
('GITD', 'Gestión de la Información y Transformación Digital', 'Proyectos de sistemas de información, gestión de datos y transformación digital empresarial'),
('ITIC', 'Infraestructura TI y Ciberseguridad', 'Proyectos de infraestructura tecnológica, redes, seguridad informática y protección de datos'),
('IEET', 'Innovación, Emprendimiento y Ética Tecnológica', 'Proyectos de innovación tecnológica, emprendimiento digital y ética en tecnología'),
('PDS', 'Programación y Desarrollo de Software', 'Proyectos de desarrollo de aplicaciones, sistemas web, móviles y arquitectura de software');

-- -----------------------------------------------------
-- Datos iniciales: Catálogo de Prerrequisitos
-- -----------------------------------------------------
INSERT INTO `db_proyecto_titulacion`.`catalogo_prerequisitos` (`nombre`, `descripcion`, `orden`, `activo`) VALUES
('Aprobación de Inglés', 'Certificado de aprobación del nivel de inglés requerido', 1, 1),
('Carta de Aceptación del Tutor', 'Documento firmado por el tutor académico aceptando dirigir el trabajo de titulación', 2, 1),
('Aprobación de Todas las Materias', 'Certificado de haber aprobado todas las asignaturas del plan de estudios', 3, 1);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
