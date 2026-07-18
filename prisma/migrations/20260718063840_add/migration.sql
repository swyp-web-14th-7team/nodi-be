-- AlterTable
ALTER TABLE `users` MODIFY `role` TINYINT NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `experiences` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(500) NOT NULL,
    `description` VARCHAR(2000) NOT NULL,
    `related_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL,
    `card_id` CHAR(26) NOT NULL,

    UNIQUE INDEX `experiences_card_id_sort_order_key`(`card_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `experiences` ADD CONSTRAINT `experiences_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `user_profile_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
