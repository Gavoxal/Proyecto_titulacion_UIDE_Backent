-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(15) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `correo_institucional` VARCHAR(191) NOT NULL,
    `rol` ENUM('ESTUDIANTE', 'TUTOR', 'DIRECTOR', 'COORDINADOR', 'COMITE', 'DOCENTE_INTEGRACION') NOT NULL DEFAULT 'ESTUDIANTE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_cedula_key`(`cedula`),
    UNIQUE INDEX `usuarios_correo_institucional_key`(`correo_institucional`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    UNIQUE INDEX `auth_username_key`(`username`),
    UNIQUE INDEX `auth_usuario_id_key`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas_conocimiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,

    UNIQUE INDEX `areas_conocimiento_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `propuestas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `objetivos` TEXT NOT NULL,
    `problematica` TEXT NULL,
    `area_conocimiento_id` INTEGER NOT NULL,
    `alcance` VARCHAR(191) NULL,
    `archivo_url` VARCHAR(191) NULL,
    `fecha_publicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('PENDIENTE', 'APROBADA', 'APROBADA_CON_COMENTARIOS', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `fk_estudiante` INTEGER NOT NULL,
    `fecha_defensa` DATETIME(3) NULL,
    `resultado_defensa` ENUM('APROBADO', 'REPROBADO', 'PENDIENTE') NULL DEFAULT 'PENDIENTE',
    `carrera` VARCHAR(191) NULL,
    `malla` VARCHAR(100) NULL,
    `comentario_revision` TEXT NULL,
    `fecha_revision` DATETIME(3) NULL,
    `revisado_por` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trabajo_titulacion` (
    `propuestas_id` INTEGER NOT NULL,
    `fk_tutor_id` INTEGER NOT NULL,
    `fecha_asignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estadoAsignacion` ENUM('ACTIVO', 'REASIGNADO', 'FINALIZADO') NOT NULL DEFAULT 'ACTIVO',
    `observaciones` TEXT NULL,

    PRIMARY KEY (`propuestas_id`, `fk_tutor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `propuesta_id` INTEGER NOT NULL,
    `tipo` ENUM('DOCENCIA', 'TUTORIA') NOT NULL DEFAULT 'DOCENCIA',
    `fecha_asignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_activacion` DATETIME(3) NULL,
    `fecha_entrega` DATETIME(3) NULL,
    `requisitos` JSON NULL,
    `estado` ENUM('ENTREGADO', 'NO_ENTREGADO') NOT NULL DEFAULT 'NO_ENTREGADO',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semana` INTEGER NOT NULL,
    `contenido` TEXT NOT NULL,
    `archivo_url` VARCHAR(191) NULL,
    `fecha_entrega` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('ENTREGADO', 'NO_ENTREGADO') NOT NULL DEFAULT 'ENTREGADO',
    `actividad_id` INTEGER NOT NULL,
    `calificacion_tutor` DECIMAL(4, 2) NULL,
    `feedback_tutor` TEXT NULL,
    `fecha_calificacion_tutor` DATETIME(3) NULL,
    `estado_revision_tutor` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REQUIERE_CAMBIOS') NULL DEFAULT 'PENDIENTE',
    `calificacion_docente` DECIMAL(4, 2) NULL,
    `feedback_docente` TEXT NULL,
    `fecha_calificacion_docente` DATETIME(3) NULL,
    `estado_revision_docente` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REQUIERE_CAMBIOS') NULL DEFAULT 'PENDIENTE',
    `calificacion_final` DECIMAL(4, 2) NULL,
    `ponderacion_tutor` DECIMAL(3, 2) NOT NULL DEFAULT 0.40,
    `ponderacion_docente` DECIMAL(3, 2) NOT NULL DEFAULT 0.60,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comentarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evidencia_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `descripcion` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogo_prerequisitos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `orden` INTEGER NOT NULL DEFAULT 1,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estudiante_prerequisitos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prerequisito_id` INTEGER NOT NULL,
    `cumplido` BOOLEAN NOT NULL DEFAULT false,
    `archivo_url` VARCHAR(191) NULL,
    `fecha_cumplimiento` DATETIME(3) NULL,
    `fk_estudiante` INTEGER NOT NULL,

    UNIQUE INDEX `estudiante_prerequisitos_fk_estudiante_prerequisito_id_key`(`fk_estudiante`, `prerequisito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mensaje` TEXT NOT NULL,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entregables_finales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('TESIS', 'MANUAL_USUARIO', 'REPOSITORIO', 'ARTICULO') NOT NULL,
    `url_archivo` VARCHAR(255) NOT NULL,
    `fecha_subida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `propuestas_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comite` (
    `usuario_id` INTEGER NOT NULL,
    `trabajo_titulacion_propuestas_id` INTEGER NOT NULL,
    `rol` ENUM('Jurado 1', 'Jurado 2', 'Presidente') NOT NULL,
    `calificacion` DECIMAL(4, 2) NULL,
    `fecha_asignada` DATE NULL,
    `hora_defensa` TIME(0) NULL,
    `aula_defensa` VARCHAR(50) NULL,
    `comentarios` TEXT NULL,
    `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',

    PRIMARY KEY (`usuario_id`, `trabajo_titulacion_propuestas_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estudiantes_perfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sexo` VARCHAR(20) NULL,
    `estado_escuela` VARCHAR(50) NULL,
    `sede` VARCHAR(100) NULL,
    `escuela` VARCHAR(100) NULL,
    `codigo_malla` VARCHAR(50) NULL,
    `malla` VARCHAR(100) NULL,
    `periodo_lectivo` VARCHAR(100) NULL,
    `ciudad` VARCHAR(100) NULL,
    `provincia` VARCHAR(100) NULL,
    `pais` VARCHAR(100) NULL,
    `usuario_id` INTEGER NOT NULL,

    UNIQUE INDEX `estudiantes_perfil_usuario_id_key`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mcp_auth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(6) NOT NULL,
    `token` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `mcp_auth_email_idx`(`email`),
    INDEX `mcp_auth_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bitacora_reuniones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tutor_id` INTEGER NOT NULL,
    `estudiante_id` INTEGER NOT NULL,
    `propuesta_id` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `hora_inicio` TIME(0) NOT NULL,
    `hora_fin` TIME(0) NOT NULL,
    `modalidad` ENUM('PRESENCIAL', 'VIRTUAL') NOT NULL,
    `resumen` TEXT NOT NULL,
    `compromisos` JSON NOT NULL,
    `asistio` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bitacora_reuniones_tutor_id_estudiante_id_idx`(`tutor_id`, `estudiante_id`),
    INDEX `bitacora_reuniones_propuesta_id_idx`(`propuesta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `votacion_tutores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estudiante_id` INTEGER NOT NULL,
    `tutor_id` INTEGER NOT NULL,
    `propuesta_id` INTEGER NOT NULL,
    `prioridad` INTEGER NOT NULL,
    `justificacion` TEXT NULL,
    `fecha_votacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `votacion_tutores_propuesta_id_idx`(`propuesta_id`),
    UNIQUE INDEX `votacion_tutores_estudiante_id_propuesta_id_prioridad_key`(`estudiante_id`, `propuesta_id`, `prioridad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluacion_defensa_privada` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propuesta_id` INTEGER NOT NULL,
    `fecha_defensa` DATE NULL,
    `hora_defensa` TIME(0) NULL,
    `aula` VARCHAR(50) NULL,
    `estado` ENUM('PENDIENTE', 'PROGRAMADA', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `calificacion` DECIMAL(4, 2) NULL,
    `comentarios` TEXT NULL,
    `fecha_evaluacion` DATETIME(3) NULL,

    UNIQUE INDEX `evaluacion_defensa_privada_propuesta_id_key`(`propuesta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participante_defensa_privada` (
    `evaluacion_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo_participante` ENUM('TUTOR', 'COMITE') NOT NULL,
    `rol` VARCHAR(50) NULL,
    `comentario` TEXT NULL,
    `calificacion` DECIMAL(4, 2) NULL,

    PRIMARY KEY (`evaluacion_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluacion_defensa_publica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propuesta_id` INTEGER NOT NULL,
    `fecha_defensa` DATE NULL,
    `hora_defensa` TIME(0) NULL,
    `aula` VARCHAR(50) NULL,
    `estado` ENUM('BLOQUEADA', 'PENDIENTE', 'PROGRAMADA', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'BLOQUEADA',
    `calificacion` DECIMAL(4, 2) NULL,
    `comentarios` TEXT NULL,
    `fecha_evaluacion` DATETIME(3) NULL,

    UNIQUE INDEX `evaluacion_defensa_publica_propuesta_id_key`(`propuesta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participante_defensa_publica` (
    `evaluacion_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo_participante` ENUM('TUTOR', 'COMITE') NOT NULL,
    `rol` VARCHAR(50) NULL,
    `comentario` TEXT NULL,
    `calificacion` DECIMAL(4, 2) NULL,

    PRIMARY KEY (`evaluacion_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth` ADD CONSTRAINT `auth_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propuestas` ADD CONSTRAINT `propuestas_area_conocimiento_id_fkey` FOREIGN KEY (`area_conocimiento_id`) REFERENCES `areas_conocimiento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propuestas` ADD CONSTRAINT `propuestas_fk_estudiante_fkey` FOREIGN KEY (`fk_estudiante`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propuestas` ADD CONSTRAINT `propuestas_revisado_por_fkey` FOREIGN KEY (`revisado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trabajo_titulacion` ADD CONSTRAINT `trabajo_titulacion_propuestas_id_fkey` FOREIGN KEY (`propuestas_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_propuesta_id_fkey` FOREIGN KEY (`propuesta_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidencia` ADD CONSTRAINT `evidencia_actividad_id_fkey` FOREIGN KEY (`actividad_id`) REFERENCES `actividades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentarios` ADD CONSTRAINT `comentarios_evidencia_id_fkey` FOREIGN KEY (`evidencia_id`) REFERENCES `evidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentarios` ADD CONSTRAINT `comentarios_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiante_prerequisitos` ADD CONSTRAINT `estudiante_prerequisitos_prerequisito_id_fkey` FOREIGN KEY (`prerequisito_id`) REFERENCES `catalogo_prerequisitos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiante_prerequisitos` ADD CONSTRAINT `estudiante_prerequisitos_fk_estudiante_fkey` FOREIGN KEY (`fk_estudiante`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entregables_finales` ADD CONSTRAINT `entregables_finales_propuestas_id_fkey` FOREIGN KEY (`propuestas_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comite` ADD CONSTRAINT `comite_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comite` ADD CONSTRAINT `comite_trabajo_titulacion_propuestas_id_fkey` FOREIGN KEY (`trabajo_titulacion_propuestas_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiantes_perfil` ADD CONSTRAINT `estudiantes_perfil_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora_reuniones` ADD CONSTRAINT `bitacora_reuniones_tutor_id_fkey` FOREIGN KEY (`tutor_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora_reuniones` ADD CONSTRAINT `bitacora_reuniones_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora_reuniones` ADD CONSTRAINT `bitacora_reuniones_propuesta_id_fkey` FOREIGN KEY (`propuesta_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votacion_tutores` ADD CONSTRAINT `votacion_tutores_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votacion_tutores` ADD CONSTRAINT `votacion_tutores_tutor_id_fkey` FOREIGN KEY (`tutor_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votacion_tutores` ADD CONSTRAINT `votacion_tutores_propuesta_id_fkey` FOREIGN KEY (`propuesta_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluacion_defensa_privada` ADD CONSTRAINT `evaluacion_defensa_privada_propuesta_id_fkey` FOREIGN KEY (`propuesta_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participante_defensa_privada` ADD CONSTRAINT `participante_defensa_privada_evaluacion_id_fkey` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluacion_defensa_privada`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participante_defensa_privada` ADD CONSTRAINT `participante_defensa_privada_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluacion_defensa_publica` ADD CONSTRAINT `evaluacion_defensa_publica_propuesta_id_fkey` FOREIGN KEY (`propuesta_id`) REFERENCES `propuestas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participante_defensa_publica` ADD CONSTRAINT `participante_defensa_publica_evaluacion_id_fkey` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluacion_defensa_publica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participante_defensa_publica` ADD CONSTRAINT `participante_defensa_publica_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
