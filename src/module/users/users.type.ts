import { Prisma } from '@/prisma/client';
import { displayProfileCardIncludeOptions } from '@/module/profile-cards/profile-cards.type';

export const userWithDefaultCardIncludeOptions = {
  profileCards: {
    where: {
      isDefault: true,
    },
    include: displayProfileCardIncludeOptions,
  },
} satisfies Prisma.UserInclude;

export type UserWithDefaultCard = Prisma.UserGetPayload<{
  include: typeof userWithDefaultCardIncludeOptions;
}>;
