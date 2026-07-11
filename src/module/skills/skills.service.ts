import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/prisma/client';
import { SkillsRepository } from '@/module/skills/skills.repository';
import { CreateSkillDto } from '@/module/skills/dto/create-skill.dto';
import { UpdateSkillDto } from '@/module/skills/dto/update-skill.dto';
import { SkillWithCategory } from '@/module/skills/skill.type';
import { FindSkillsDto } from '@/module/skills/dto/find-skills.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  /** 스킬 목록 조회 (categoryId·search 로 필터 가능) */
  async findAll(
    dto: FindSkillsDto,
  ): Promise<PaginationResult<SkillWithCategory>> {
    return this.skillsRepository.findAll(dto);
  }

  async findById(id: number): Promise<SkillWithCategory> {
    const skill = await this.skillsRepository.findById(id);
    if (!skill) throw new NotFoundException('스킬을 찾을 수 없습니다.');
    return skill;
  }

  async create(dto: CreateSkillDto): Promise<SkillWithCategory> {
    try {
      return await this.skillsRepository.create(dto.name, dto.categoryId);
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async update(id: number, dto: UpdateSkillDto): Promise<SkillWithCategory> {
    await this.findById(id); // 존재 확인 (없으면 404)
    try {
      return await this.skillsRepository.update(id, {
        name: dto.name,
        categoryId: dto.categoryId,
      });
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async delete(id: number): Promise<void> {
    await this.findById(id); // 존재 확인 (없으면 404)
    await this.skillsRepository.delete(id);
  }

  /** name 중복(P2002) / 존재하지 않는 카테고리(P2003) 를 사용자 친화적 에러로 변환 */
  private handleWriteError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002')
        throw new ConflictException('이미 존재하는 스킬 이름입니다.');
      if (e.code === 'P2003')
        throw new BadRequestException('존재하지 않는 카테고리입니다.');
    }
    throw e;
  }
}
