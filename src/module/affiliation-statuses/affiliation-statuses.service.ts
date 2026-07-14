import { Injectable, NotFoundException } from '@nestjs/common';
import { AffiliationStatusesRepository } from '@/module/affiliation-statuses/affiliation-statuses.repository';
import { AffiliationStatus } from '@/prisma/client';
import { CreateAffiliationStatusDto } from '@/module/affiliation-statuses/dto/create-affiliation-status.dto';
import { UpdateAffiliationStatusDto } from '@/module/affiliation-statuses/dto/update-affiliation-status.dto';
import { FindAffiliationStatusDto } from '@/module/affiliation-statuses/dto/find-affiliation-status.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class AffiliationStatusesService {
  constructor(
    private readonly affiliationStatusesRepository: AffiliationStatusesRepository,
  ) {}

  async findMany(
    dto: FindAffiliationStatusDto,
  ): Promise<PaginationResult<AffiliationStatus>> {
    return this.affiliationStatusesRepository.findMany(dto);
  }

  async create(dto: CreateAffiliationStatusDto): Promise<AffiliationStatus> {
    return this.affiliationStatusesRepository.createAffiliationStatus(dto);
  }

  async update(
    id: number,
    dto: UpdateAffiliationStatusDto,
  ): Promise<AffiliationStatus> {
    await this.findByIdOrThrow(id);
    return this.affiliationStatusesRepository.updateAffiliationStatus(id, dto);
  }

  async delete(id: number): Promise<AffiliationStatus> {
    await this.findByIdOrThrow(id);
    return this.affiliationStatusesRepository.deleteAffiliationStatus(id);
  }

  private async findByIdOrThrow(id: number): Promise<AffiliationStatus> {
    const target: AffiliationStatus | null =
      await this.affiliationStatusesRepository.findUnique(id);
    if (!target) throw new NotFoundException('소속 상태 를 찾을 수 없습니다.');
    return target;
  }
}
