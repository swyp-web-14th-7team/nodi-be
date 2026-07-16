import { Prisma } from '@/prisma/client';

export const SkillInclude = {
  category: true,
  skillJobTypes: {
    select: {
      jobType: true,
    },
  },
} satisfies Prisma.SkillInclude;

export type SkillWithRelations = Prisma.SkillGetPayload<{
  include: typeof SkillInclude;
}>;
