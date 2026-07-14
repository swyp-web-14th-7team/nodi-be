-- AlterTable
ALTER TABLE `user_profile_cards` ADD COLUMN `profile_image_url` VARCHAR(500) NULL,
    ADD COLUMN `purpose_id` INTEGER UNSIGNED NULL;

-- CreateTable
CREATE TABLE `purposes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `purposes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profile_cards` ADD CONSTRAINT `user_profile_cards_purpose_id_fkey` FOREIGN KEY (`purpose_id`) REFERENCES `purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
