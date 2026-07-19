/*
  Warnings:

  - A unique constraint covering the columns `[user_id,card_id]` on the table `user_collections` will be added. If there are existing duplicate values, this will fail.
  - Made the column `group_id` on table `user_collections` required. This step will fail if there are existing NULL values in that column.
  - Made the column `card_id` on table `user_collections` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `user_collections` DROP FOREIGN KEY `user_collections_card_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_collections` DROP FOREIGN KEY `user_collections_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_collections` DROP FOREIGN KEY `user_collections_user_id_fkey`;

-- DropIndex
DROP INDEX `user_collections_card_id_fkey` ON `user_collections`;

-- DropIndex
DROP INDEX `user_collections_group_id_fkey` ON `user_collections`;

-- DropIndex
DROP INDEX `user_collections_user_id_group_id_card_id_key` ON `user_collections`;

-- AlterTable
ALTER TABLE `collection_groups` MODIFY `name` VARCHAR(100) NOT NULL DEFAULT '보관함';

-- AlterTable
ALTER TABLE `user_collections` MODIFY `group_id` INTEGER UNSIGNED NOT NULL,
    MODIFY `card_id` CHAR(26) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_collections_user_id_card_id_key` ON `user_collections`(`user_id`, `card_id`);

-- DropForeignKey
ALTER TABLE `experiences` DROP FOREIGN KEY `experiences_card_id_fkey`;

-- AddForeignKey
ALTER TABLE `experiences` ADD CONSTRAINT `experiences_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `user_profile_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_collections` ADD CONSTRAINT `user_collections_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `collection_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_collections` ADD CONSTRAINT `user_collections_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `user_profile_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
