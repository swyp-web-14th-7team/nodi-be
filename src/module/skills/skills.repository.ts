import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, Skill } from '@/prisma/client';
import { SkillInclude, SkillWithRelations } from '@/module/skills/skill.type';
import { FindSkillsDto } from '@/module/skills/dto/find-skills.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** categoryId·jobTypeId·search 로 필터 (모두 생략 시 전체 조회) */
  async findAll({
    categoryId,
    jobTypeId,
    sort,
    order,
    limit,
    search,
    skip,
  }: FindSkillsDto): Promise<PaginationResult<SkillWithRelations>> {
    const whereOptions: Prisma.SkillWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      // 스킬 하나가 여러 직군에 매핑되므로 some 으로 "해당 직군을 가진 스킬"을 찾는다
      ...(jobTypeId ? { skillJobTypes: { some: { jobTypeId } } } : {}),
      ...(search ? { name: { contains: search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prismaService.skill.findMany({
        where: whereOptions,
        include: SkillInclude,
        take: limit,
        skip,
        orderBy: { [sort]: order },
      }),
      this.prismaService.skill.count({
        where: whereOptions,
      }),
    ]);
    return { items, total };
  }

  async findById(id: number): Promise<SkillWithRelations | null> {
    return this.prismaService.skill.findUnique({
      where: { id },
      include: SkillInclude,
    });
  }

  async create(
    name: string,
    categoryId: number,
    jobTypeIds: number[],
  ): Promise<SkillWithRelations> {
    return this.prismaService.skill.create({
      data: {
        name,
        categoryId,
        skillJobTypes: {
          createMany: {
            data: jobTypeIds.map((jobTypeId) => ({ jobTypeId })),
          },
        },
      },
      include: SkillInclude,
    });
  }

  /**
   * 스킬 수정 (dto 에 포함된 필드만 변경)
   * jobTypeIds 를 넘기면 그 목록으로 직군 매핑을 덮어쓴다:
   * 목록에 없는 것만 삭제(notIn) + 없는 것만 추가(skipDuplicates) — 유지되는 건 안 건드림
   */
  async update(
    id: number,
    data: { name?: string; categoryId?: number; jobTypeIds?: number[] },
  ): Promise<SkillWithRelations> {
    const { name, categoryId, jobTypeIds } = data;
    return this.prismaService.skill.update({
      where: { id },
      data: {
        name,
        categoryId,
        ...(jobTypeIds !== undefined && {
          skillJobTypes: {
            deleteMany: { jobTypeId: { notIn: jobTypeIds } },
            createMany: {
              data: jobTypeIds.map((jobTypeId) => ({ jobTypeId })),
              skipDuplicates: true,
            },
          },
        }),
      },
      include: SkillInclude,
    });
  }

  async delete(id: number): Promise<Skill> {
    // skillJobTypes 는 onDelete: Cascade 라 함께 정리된다
    return this.prismaService.skill.delete({ where: { id } });
  }
}
