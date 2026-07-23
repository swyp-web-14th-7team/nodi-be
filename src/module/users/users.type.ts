import { Prisma } from '@/prisma/client';

export const userWithLastLoginIncludeOptions = {
  refreshTokens: {
    orderBy: { updatedAt: 'desc' },
    take: 1,
    select: { updatedAt: true },
  },
} satisfies Prisma.UserInclude;

export type UserWithLastLogin = Prisma.UserGetPayload<{
  include: typeof userWithLastLoginIncludeOptions;
}>;
