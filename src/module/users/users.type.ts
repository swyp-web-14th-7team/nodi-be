import { Prisma } from '@/prisma/client';

// 관리자 조회용: 가장 최근 리프레시 토큰(= 마지막 로그인)의 생성 시각만 포함
export const userWithLastLoginIncludeOptions = {
  refreshTokens: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { createdAt: true },
  },
} satisfies Prisma.UserInclude;

export type UserWithLastLogin = Prisma.UserGetPayload<{
  include: typeof userWithLastLoginIncludeOptions;
}>;
