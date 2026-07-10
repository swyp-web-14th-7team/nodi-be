import { Injectable, NotFoundException } from '@nestjs/common';
import { InterestsRepository } from '@/module/interests/interests.repository';
import { Interest } from '@/prisma/client';
import { CreateInterestDto } from '@/module/interests/dto/create-interest.dto';
import { UpdateInterestDto } from '@/module/interests/dto/update-interest.dto';
import { FindInterestDto } from '@/module/interests/dto/find-interest.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class InterestsService {
  constructor(private readonly interestsRepository: InterestsRepository) {}

  async findMany(dto: FindInterestDto): Promise<PaginationResult<Interest>> {
    return this.interestsRepository.findMany(dto);
  }

  async create(dto: CreateInterestDto): Promise<Interest> {
    return this.interestsRepository.createInterest(dto);
  }

  async update(id: number, dto: UpdateInterestDto): Promise<Interest> {
    await this.findByIdOrThrow(id);
    return this.interestsRepository.updateInterest(id, dto);
  }

  async delete(id: number): Promise<Interest> {
    await this.findByIdOrThrow(id);
    return this.interestsRepository.deleteInterest(id);
  }

  private async findByIdOrThrow(id: number): Promise<Interest> {
    const target: Interest | null =
      await this.interestsRepository.findUnique(id);
    if (!target) throw new NotFoundException('interest 를 찾을 수 없습니다.');
    return target;
  }
}
