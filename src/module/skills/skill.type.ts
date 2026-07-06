import { Prisma } from '@/prisma/client';

export const SkillInclude = {
  category: true,
} satisfies Prisma.SkillInclude;

export type SkillWithCategory = Prisma.SkillGetPayload<{
  include: typeof SkillInclude;
}>;
