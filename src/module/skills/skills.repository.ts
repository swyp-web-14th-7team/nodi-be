import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Skill } from '@/prisma/client';
import { SkillInclude, SkillWithCategory } from '@/module/skills/skill.type';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** categoryId 가 있으면 해당 카테고리로 필터, 없으면 전체 조회 */
  async findAll(categoryId?: number): Promise<SkillWithCategory[]> {
    return this.prismaService.skill.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: SkillInclude,
      orderBy: { id: 'asc' },
    });
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
