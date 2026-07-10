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
  // TODO: 대표 기록 추가
} satisfies Prisma.UserProfileCardInclude;

export type DisplayProfileCard = Prisma.UserProfileCardGetPayload<{
  include: typeof displayProfileCardIncludeOptions;
}>;
