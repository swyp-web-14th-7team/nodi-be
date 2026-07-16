-- CreateTable
CREATE TABLE `skill_job_types` (
    `skill_id` INTEGER UNSIGNED NOT NULL,
    `job_type_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`skill_id`, `job_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `skill_job_types` ADD CONSTRAINT `skill_job_types_skill_id_fkey` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skill_job_types` ADD CONSTRAINT `skill_job_types_job_type_id_fkey` FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
