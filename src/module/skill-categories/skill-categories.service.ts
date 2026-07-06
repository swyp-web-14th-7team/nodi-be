import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SkillCategory } from '@/prisma/client';
import { SkillCategoriesRepository } from '@/module/skill-categories/skill-categories.repository';
import { CreateSkillCategoryDto } from '@/module/skill-categories/dto/create-skill-category.dto';
import { UpdateSkillCategoryDto } from '@/module/skill-categories/dto/update-skill-category.dto';

@Injectable()
export class SkillCategoriesService {
  constructor(
    private readonly skillCategoriesRepository: SkillCategoriesRepository,
  ) {}

  /** 스킬 카테고리 전체 조회 */
  async findAll(): Promise<SkillCategory[]> {
    return this.skillCategoriesRepository.findAll();
  }

  /** 스킬 카테고리 단건 조회 (없으면 404) */
  async findById(id: number): Promise<SkillCategory> {
    const category = await this.skillCategoriesRepository.findById(id);
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    return category;
  }

  /** 스킬 카테고리 생성 (이름 중복 시 409) */
  async create(dto: CreateSkillCategoryDto): Promise<SkillCategory> {
    try {
      return await this.skillCategoriesRepository.create(dto.name);
    } catch (e) {
      this.handleUniqueName(e);
    }
  }

  /** 스킬 카테고리 수정 (없으면 404, 이름 중복 시 409) */
  async update(
    id: number,
    dto: UpdateSkillCategoryDto,
  ): Promise<SkillCategory> {
    await this.findById(id); // 존재 확인
    try {
      return await this.skillCategoriesRepository.update(id, {
        name: dto.name,
      });
    } catch (e) {
      this.handleUniqueName(e);
    }
  }

  /** 스킬 카테고리 삭제 (없으면 404, 속한 스킬이 있으면 409) */
  async delete(id: number): Promise<void> {
    await this.findById(id); // 존재 확인
    try {
      await this.skillCategoriesRepository.delete(id);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      )
        throw new ConflictException(
          '카테고리에 속한 스킬이 있어 삭제할 수 없습니다.',
        );
      throw e;
    }
  }

  /** 이름 중복(P2002) → 409 로 변환 (create / update 공용) */
  private handleUniqueName(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ConflictException('이미 존재하는 카테고리 이름입니다.');
    throw e;
  }
}
