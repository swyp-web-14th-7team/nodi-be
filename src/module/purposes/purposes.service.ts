import { Injectable, NotFoundException } from '@nestjs/common';
import { PurposesRepository } from '@/module/purposes/purposes.repository';
import { Purpose } from '@/prisma/client';
import { CreatePurposeDto } from '@/module/purposes/dto/create-purpose.dto';
import { UpdatePurposeDto } from '@/module/purposes/dto/update-purpose.dto';
import { FindPurposeDto } from '@/module/purposes/dto/find-purpose.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class PurposesService {
  constructor(private readonly purposesRepository: PurposesRepository) {}

  async findMany(dto: FindPurposeDto): Promise<PaginationResult<Purpose>> {
    return this.purposesRepository.findMany(dto);
  }

  async create(dto: CreatePurposeDto): Promise<Purpose> {
    return this.purposesRepository.createPurpose(dto);
  }

  async update(id: number, dto: UpdatePurposeDto): Promise<Purpose> {
    await this.findByIdOrThrow(id);
    return this.purposesRepository.updatePurpose(id, dto);
  }

  async delete(id: number): Promise<Purpose> {
    await this.findByIdOrThrow(id);
    return this.purposesRepository.deletePurpose(id);
  }

  private async findByIdOrThrow(id: number): Promise<Purpose> {
    const target: Purpose | null = await this.purposesRepository.findUnique(id);
    if (!target) throw new NotFoundException('목적 을 찾을 수 없습니다.');
    return target;
  }
}
