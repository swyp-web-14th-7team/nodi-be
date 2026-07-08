import { Prisma } from '@/prisma/client';

export const defaultProfileCardIncludeOptions = {
  profileCardSkills: true,
  profileCardInterests: true,
} satisfies Prisma.UserProfileCardInclude;

export type DefaultUserProfileCard = Prisma.UserProfileCardGetPayload<{
  include: typeof defaultProfileCardIncludeOptions;
}>;
