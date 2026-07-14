/*
  Warnings:

  - You are about to drop the column `template_id` on the `user_profile_cards` table. All the data in the column will be lost.
  - You are about to drop the `profile_card_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profile_card_template_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profile_card_templates` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `job_type_id` to the `user_profile_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `profile_card_items` DROP FOREIGN KEY `profile_card_items_profile_card_id_fkey`;

-- DropForeignKey
ALTER TABLE `profile_card_items` DROP FOREIGN KEY `profile_card_items_template_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `profile_card_template_items` DROP FOREIGN KEY `profile_card_template_items_template_id_fkey`;

-- DropForeignKey
ALTER TABLE `profile_card_templates` DROP FOREIGN KEY `profile_card_templates_job_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_profile_cards` DROP FOREIGN KEY `user_profile_cards_template_id_fkey`;

-- DropIndex
DROP INDEX `user_profile_cards_template_id_fkey` ON `user_profile_cards`;

-- AlterTable
ALTER TABLE `user_profile_cards` DROP COLUMN `template_id`,
    ADD COLUMN `job_type_id` INTEGER UNSIGNED NOT NULL;

-- DropTable
DROP TABLE `profile_card_items`;

-- DropTable
DROP TABLE `profile_card_template_items`;

-- DropTable
DROP TABLE `profile_card_templates`;

-- AddForeignKey
ALTER TABLE `user_profile_cards` ADD CONSTRAINT `user_profile_cards_job_type_id_fkey` FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
