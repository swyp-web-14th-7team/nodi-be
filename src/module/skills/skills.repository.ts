import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, Skill } from '@/prisma/client';
import { SkillInclude, SkillWithCategory } from '@/module/skills/skill.type';
import { FindSkillsDto } from '@/module/skills/dto/find-skills.dto';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** categoryId·search 로 필터 (둘 다 생략 시 전체 조회) */
  async findAll({
    categoryId,
    sort,
    order,
    limit,
    search,
    skip,
  }: FindSkillsDto): Promise<{ items: SkillWithCategory[]; total: number }> {
    const whereOptions: Prisma.SkillWhereInput = {
      ...(categoryId ? { categoryId } : {}),
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

  async findById(id: number): Promise<SkillWithCategory | null> {
    return this.prismaService.skill.findUnique({
      where: { id },
      include: SkillInclude,
    });
  }

  async create(name: string, categoryId: number): Promise<SkillWithCategory> {
    return this.prismaService.skill.create({
      data: { name, categoryId },
      include: SkillInclude,
    });
  }

  async update(
    id: number,
    data: { name?: string; categoryId?: number },
  ): Promise<SkillWithCategory> {
    return this.prismaService.skill.update({
      where: { id },
      data,
      include: SkillInclude,
    });
  }

  async delete(id: number): Promise<Skill> {
    return this.prismaService.skill.delete({ where: { id } });
  }
}
