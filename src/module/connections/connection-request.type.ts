import { Prisma } from '@/prisma/client';
import { displayProfileCardIncludeOptions } from '@/module/profile-cards/profile-cards.type';

// 받은 요청함: 요청을 보낸 카드(requesterCard) 전체를 포함 (상대 카드를 보여주기 위함)
export const receivedRequestIncludeOptions = {
  requesterCard: { include: displayProfileCardIncludeOptions },
} satisfies Prisma.CardConnectionRequestInclude;

export type ReceivedConnectionRequest = Prisma.CardConnectionRequestGetPayload<{
  include: typeof receivedRequestIncludeOptions;
}>;

// 보낸 요청함: 요청을 받은 카드(receiverCard) 전체를 포함
export const sentRequestIncludeOptions = {
  receiverCard: { include: displayProfileCardIncludeOptions },
} satisfies Prisma.CardConnectionRequestInclude;

export type SentConnectionRequest = Prisma.CardConnectionRequestGetPayload<{
  include: typeof sentRequestIncludeOptions;
}>;

// 카드 확인용: 소유자·활성 여부 + 알림 문구에 쓰는 닉네임
export const cardOwnershipSelectOptions = {
  id: true,
  userId: true,
  isActive: true,
  nickname: true,
} satisfies Prisma.UserProfileCardSelect;

export type CardOwnership = Prisma.UserProfileCardGetPayload<{
  select: typeof cardOwnershipSelectOptions;
}>;

// 권한 확인용: 양쪽 카드의 소유자(userId) 만 포함
export const requestPartiesIncludeOptions = {
  requesterCard: { select: { userId: true, nickname: true } },
  receiverCard: { select: { userId: true, nickname: true } },
} satisfies Prisma.CardConnectionRequestInclude;

export type ConnectionRequestWithParties =
  Prisma.CardConnectionRequestGetPayload<{
    include: typeof requestPartiesIncludeOptions;
  }>;
