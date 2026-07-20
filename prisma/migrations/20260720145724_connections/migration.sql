-- CreateTable
CREATE TABLE `card_connection_requests` (
    `id` CHAR(26) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 0,
    `message` VARCHAR(500) NULL,
    `requester_card_id` CHAR(26) NOT NULL,
    `receiver_card_id` CHAR(26) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,

    INDEX `card_connection_requests_receiver_card_id_status_idx`(`receiver_card_id`, `status`),
    UNIQUE INDEX `card_connection_requests_requester_card_id_receiver_card_id_key`(`requester_card_id`, `receiver_card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_connections` (
    `id` CHAR(26) NOT NULL,
    `requester_user_id` CHAR(26) NOT NULL,
    `receiver_user_id` CHAR(26) NOT NULL,
    `requester_card_id` CHAR(26) NOT NULL,
    `receiver_card_id` CHAR(26) NOT NULL,
    `requester_card_snapshot` JSON NOT NULL,
    `receiver_card_snapshot` JSON NOT NULL,
    `message` VARCHAR(255) NULL,
    `requester_removed_at` DATETIME(3) NULL,
    `receiver_removed_at` DATETIME(3) NULL,
    `connected_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `card_connections_requester_user_id_idx`(`requester_user_id`),
    INDEX `card_connections_receiver_user_id_idx`(`receiver_user_id`),
    UNIQUE INDEX `card_connections_requester_card_id_receiver_card_id_key`(`requester_card_id`, `receiver_card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_collections` ADD CONSTRAINT `user_collections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_connection_requests` ADD CONSTRAINT `card_connection_requests_requester_card_id_fkey` FOREIGN KEY (`requester_card_id`) REFERENCES `user_profile_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_connection_requests` ADD CONSTRAINT `card_connection_requests_receiver_card_id_fkey` FOREIGN KEY (`receiver_card_id`) REFERENCES `user_profile_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
