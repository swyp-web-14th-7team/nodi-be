import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { AffiliationStatus, Prisma } from '@/prisma/client';
import { FindAffiliationStatusDto } from '@/module/affiliation-statuses/dto/find-affiliation-status.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class AffiliationStatusesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(
    dto: FindAffiliationStatusDto,
  ): Promise<PaginationResult<AffiliationStatus>> {
    const { skip, limit, sort, order, search } = dto;
    const where: Prisma.AffiliationStatusWhereInput = search
      ? { name: { contains: search } }
      : {};
    const [items, total] = await Promise.all([
      this.prismaService.affiliationStatus.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prismaService.affiliationStatus.count({ where }),
    ]);
    return { items, total };
  }

  async createAffiliationStatus(
    params: Prisma.AffiliationStatusCreateInput,
  ): Promise<AffiliationStatus> {
    return this.prismaService.affiliationStatus.create({ data: params });
  }

  async findUnique(id: number) {
    return this.prismaService.affiliationStatus.findUnique({ where: { id } });
  }

  async updateAffiliationStatus(
    id: number,
    params: Prisma.AffiliationStatusUpdateInput,
  ) {
    return this.prismaService.affiliationStatus.update({
      where: { id },
      data: params,
    });
  }

  async deleteAffiliationStatus(id: number) {
    return this.prismaService.affiliationStatus.delete({ where: { id } });
  }
}
