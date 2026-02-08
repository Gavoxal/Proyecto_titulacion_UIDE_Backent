-- DropForeignKey
ALTER TABLE `estudiante_prerequisitos` DROP FOREIGN KEY `estudiante_prerequisitos_fk_estudiante_fkey`;

-- DropIndex
DROP INDEX `estudiante_prerequisitos_fk_estudiante_prerequisito_id_key` ON `estudiante_prerequisitos`;

-- AddForeignKey
ALTER TABLE `estudiante_prerequisitos` ADD CONSTRAINT `estudiante_prerequisitos_fk_estudiante_fkey` FOREIGN KEY (`fk_estudiante`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
