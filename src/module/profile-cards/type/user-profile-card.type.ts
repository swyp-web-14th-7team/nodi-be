import { Prisma } from '@/prisma/client';

export const ProfileCardInclude = {
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
} satisfies Prisma.UserProfileCardInclude;

export type ProfileCard = Prisma.UserProfileCardGetPayload<{
  include: typeof ProfileCardInclude;
}>;
