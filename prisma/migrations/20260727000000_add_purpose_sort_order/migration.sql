-- 기존 목적은 현재 id 순서를 유지하면서 0부터 연속된 값으로 채운다.
ALTER TABLE `purposes` ADD COLUMN `sort_order` INTEGER NULL;

SET @purpose_sort_order := -1;
UPDATE `purposes`
SET `sort_order` = (@purpose_sort_order := @purpose_sort_order + 1)
ORDER BY `id`;

ALTER TABLE `purposes` MODIFY `sort_order` INTEGER NOT NULL;
