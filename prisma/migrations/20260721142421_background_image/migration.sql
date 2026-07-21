-- CreateTable
CREATE TABLE `card_background_images` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `image_url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
