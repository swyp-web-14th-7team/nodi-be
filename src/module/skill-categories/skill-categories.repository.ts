import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { SkillCategory } from '@/prisma/client';

@Injectable()
export class SkillCategoriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** 스킬 카테고리 전체 조회 */
  async findAll(): Promise<SkillCategory[]> {
    return this.prismaService.skillCategory.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /** 스킬 카테고리 단건 조회 */
  async findById(id: number): Promise<SkillCategory | null> {
    return this.prismaService.skillCategory.findUnique({ where: { id } });
  }

  /** 스킬 카테고리 생성 */
  async create(name: string): Promise<SkillCategory> {
    return this.prismaService.skillCategory.create({ data: { name } });
  }

  /** 스킬 카테고리 수정 */
  async update(id: number, data: { name?: string }): Promise<SkillCategory> {
    return this.prismaService.skillCategory.update({ where: { id }, data });
  }

  /** 스킬 카테고리 삭제 */
  async delete(id: number): Promise<SkillCategory> {
    return this.prismaService.skillCategory.delete({ where: { id } });
  }
}
