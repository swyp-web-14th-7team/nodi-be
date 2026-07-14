import { Injectable, NotFoundException } from '@nestjs/common';
import { PersonalitiesRepository } from '@/module/personalities/personalities.repository';
import { Personality } from '@/prisma/client';
import { CreatePersonalityDto } from '@/module/personalities/dto/create-personality.dto';
import { UpdatePersonalityDto } from '@/module/personalities/dto/update-personality.dto';
import { FindPersonalityDto } from '@/module/personalities/dto/find-personality.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class PersonalitiesService {
  constructor(
    private readonly personalitiesRepository: PersonalitiesRepository,
  ) {}

  async findMany(
    dto: FindPersonalityDto,
  ): Promise<PaginationResult<Personality>> {
    return this.personalitiesRepository.findMany(dto);
  }

  async create(dto: CreatePersonalityDto): Promise<Personality> {
    return this.personalitiesRepository.createPersonality(dto);
  }

  async update(id: number, dto: UpdatePersonalityDto): Promise<Personality> {
    await this.findByIdOrThrow(id);
    return this.personalitiesRepository.updatePersonality(id, dto);
  }

  async delete(id: number): Promise<Personality> {
    await this.findByIdOrThrow(id);
    return this.personalitiesRepository.deletePersonality(id);
  }

  private async findByIdOrThrow(id: number): Promise<Personality> {
    const target: Personality | null =
      await this.personalitiesRepository.findUnique(id);
    if (!target) throw new NotFoundException('개성 을 찾을 수 없습니다.');
    return target;
  }
}
