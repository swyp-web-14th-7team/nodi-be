-- 기본(default) 프로필 카드 개념 제거
-- 온보딩 카드는 더 이상 특별하지 않으며, 목적(purpose)만 지정된 비공개(is_active=false) 카드다.
--
-- user_id FK 가 (user_id, is_default) 유니크 인덱스를 최좌측 프리픽스로 사용하고 있어
-- 인덱스를 바로 드롭할 수 없다(MySQL error 1553). FK 를 먼저 떼고 인덱스/컬럼을 정리한 뒤
-- FK 를 다시 건다. FK 재생성이 user_id 단일 인덱스도 함께 만든다.

-- DropForeignKey
ALTER TABLE `user_profile_cards` DROP FOREIGN KEY `user_profile_cards_user_id_fkey`;

-- DropIndex
DROP INDEX `user_profile_cards_user_id_is_default_key` ON `user_profile_cards`;

-- AlterTable
ALTER TABLE `user_profile_cards` DROP COLUMN `is_default`;

-- AddForeignKey
ALTER TABLE `user_profile_cards` ADD CONSTRAINT `user_profile_cards_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;