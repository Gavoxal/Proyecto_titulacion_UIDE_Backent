-- AlterTable
ALTER TABLE `comentarios` ADD COLUMN `propuesta_id` INTEGER NULL,
    MODIFY `evidencia_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `entregables_finales` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `comentarios` ADD CONSTRAINT `comentarios_propuesta_id_fkey` FOREIGN KEY (`propuesta_id`) REFERENCES `propuestas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
