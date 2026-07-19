import { Prisma } from '@/prisma/client';
import { displayProfileCardIncludeOptions } from '@/module/profile-cards/profile-cards.type';

// 스크랩 = 카드 전체(단건 조회와 동일 형태)를 포함
export const collectionWithCardIncludeOptions = {
  card: { include: displayProfileCardIncludeOptions },
} satisfies Prisma.UserCollectionInclude;

export type CollectionWithCard = Prisma.UserCollectionGetPayload<{
  include: typeof collectionWithCardIncludeOptions;
}>;

// 그룹 목록: 담긴 스크랩 개수(_count)만 함께
export const collectionGroupWithCountIncludeOptions = {
  _count: { select: { userCollections: true } },
} satisfies Prisma.CollectionGroupInclude;

export type CollectionGroupWithCount = Prisma.CollectionGroupGetPayload<{
  include: typeof collectionGroupWithCountIncludeOptions;
}>;
