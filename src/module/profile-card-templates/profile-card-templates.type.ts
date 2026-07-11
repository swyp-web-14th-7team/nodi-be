import { Prisma } from '@/prisma/client';

export const templateInclude = {
  jobType: true,
  profileCardTemplateItems: true,
} satisfies Prisma.ProfileCardTemplateInclude;

export type TemplateType = Prisma.ProfileCardTemplateGetPayload<{
  include: typeof templateInclude;
}>;
