/*
  Warnings:

  - A unique constraint covering the columns `[job_type_id,is_active]` on the table `profile_card_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `profile_card_templates` ADD COLUMN `is_active` BOOLEAN NULL;

-- CreateIndex
CREATE UNIQUE INDEX `profile_card_templates_job_type_id_is_active_key` ON `profile_card_templates`(`job_type_id`, `is_active`);
