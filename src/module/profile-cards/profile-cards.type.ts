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
} satisfies Prisma.UserProfileCardInclude;

export type DisplayProfileCard = Prisma.UserProfileCardGetPayload<{
  include: typeof displayProfileCardIncludeOptions;
}>;
