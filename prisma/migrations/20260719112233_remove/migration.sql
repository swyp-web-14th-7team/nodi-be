/*
  Warnings:

  - You are about to drop the column `share_token` on the `user_profile_cards` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `user_profile_cards_share_token_key` ON `user_profile_cards`;

-- AlterTable
ALTER TABLE `user_profile_cards` DROP COLUMN `share_token`;
