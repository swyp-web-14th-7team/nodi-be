import { Prisma } from '@/prisma/client';

export const defaultProfileCardIncludeOptions = {
  profileCardSkills: true,
  profileCardInterests: true,
} satisfies Prisma.UserProfileCardInclude;

export type DefaultUserProfileCard = Prisma.UserProfileCardGetPayload<{
  include: typeof defaultProfileCardIncludeOptions;
}>;

export const displayProfileCardIncludeOptions = {
  profileCardSkills: {
    select: {
      skill: {
        include: {
          category: true,
        },
      },
    },
  },
  profileCardInterests: {
    select: {
      interest: true,
    },
  },
  personality: true,
  affiliationStatus: true,
  purpose: true,
  jobType: {
    select: {
      name: true,
    },
  },
  profileCardLinks: true,
  // 단건 조회(get)·수정(update)·생성(create): 전체 경험을 순서대로
  experiences: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.UserProfileCardInclude;

export type DisplayProfileCard = Prisma.UserProfileCardGetPayload<{
  include: typeof displayProfileCardIncludeOptions;
}>;

// 목록 조회(getAll)용: 관계 구성은 display 와 동일하되 경험은 대표(맨 앞) 1개만.
// where/take 는 payload 타입을 바꾸지 않으므로 결과는 DisplayProfileCard 로 호환됨.
export const listProfileCardIncludeOptions = {
  ...displayProfileCardIncludeOptions,
  experiences: { orderBy: { sortOrder: 'asc' }, take: 1 },
} satisfies Prisma.UserProfileCardInclude;
