/*
  Warnings:

  - Added the required column `sort_order` to the `purposes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `purposes` ADD COLUMN `sort_order` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` TINYINT NOT NULL DEFAULT 0;
