import { Injectable } from '@nestjs/common';
import { Prisma } from '@/prisma/client';
import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  templateInclude,
  TemplateType,
} from '@/module/profile-card-templates/profile-card-templates.type';
import { TemplateItemDto } from '@/module/profile-card-templates/dto/template-item.dto';
import { FindProfileCardTemplateDto } from '@/module/profile-card-templates/dto/find-profile-card-template.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class ProfileCardTemplatesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByIdWithItems(id: number): Promise<TemplateType | null> {
    return this.prismaService.profileCardTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
  }

  async findMany(
    dto: FindProfileCardTemplateDto,
  ): Promise<PaginationResult<TemplateType>> {
    const { skip, limit, sort, order, jobTypeId } = dto;
    const where: Prisma.ProfileCardTemplateWhereInput =
      jobTypeId !== undefined ? { jobTypeId } : {};
    const [items, total] = await Promise.all([
      this.prismaService.profileCardTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: templateInclude,
      }),
      this.prismaService.profileCardTemplate.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * 템플릿 삭제 (원자적).
   * 소유물인 templateItems 를 먼저 지우고 템플릿을 지운다.
   * 연결된 프로필 카드가 있으면 FK(Restrict) 위반으로 P2003 이 발생하며 트랜잭션이 롤백된다.
   */
  async deleteTemplate(id: number): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      await tx.profileCardTemplateItem.deleteMany({
        where: { templateId: id },
      });
      await tx.profileCardTemplate.delete({ where: { id } });
    });
  }

  /**
   * 직군의 새 활성 버전을 발행한다 (원자적).
   * - 기존 활성 버전 → isActive=null 로 강등 (과거 버전은 불변 보존)
   * - version = 해당 직군 max+1, isActive=true, items 복제
   */
  async publishVersion(
    jobTypeId: number,
    items: TemplateItemDto[],
  ): Promise<TemplateType> {
    return this.prismaService.$transaction(async (tx) => {
      // 기존 활성 버전 강등 (없으면 no-op)
      await tx.profileCardTemplate.updateMany({
        where: { jobTypeId, isActive: true },
        data: { isActive: null },
      });

      const latest = await tx.profileCardTemplate.findFirst({
        where: { jobTypeId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const nextVersion = (latest?.version ?? 0) + 1;

      return tx.profileCardTemplate.create({
        data: {
          jobTypeId,
          version: nextVersion,
          isActive: true,
          profileCardTemplateItems: {
            createMany: {
              data: items.map((item) => ({
                label: item.label,
                description: item.description,
                type: item.type,
              })),
            },
          },
        },
        include: templateInclude,
      });
    });
  }
}
