import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Purpose, Prisma } from '@/prisma/client';
import { FindPurposeDto } from '@/module/purposes/dto/find-purpose.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class PurposesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(dto: FindPurposeDto): Promise<PaginationResult<Purpose>> {
    const { skip, limit, sort, order, search } = dto;
    const where: Prisma.PurposeWhereInput = search
      ? { name: { contains: search } }
      : {};
    const [items, total] = await Promise.all([
      this.prismaService.purpose.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prismaService.purpose.count({ where }),
    ]);
    return { items, total };
  }

  async createPurpose(params: Prisma.PurposeCreateInput): Promise<Purpose> {
    return this.prismaService.purpose.create({ data: params });
  }

  async findUnique(id: number) {
    return this.prismaService.purpose.findUnique({ where: { id } });
  }

  async updatePurpose(id: number, params: Prisma.PurposeUpdateInput) {
    return this.prismaService.purpose.update({ where: { id }, data: params });
  }

  async deletePurpose(id: number) {
    return this.prismaService.purpose.delete({ where: { id } });
  }
}
