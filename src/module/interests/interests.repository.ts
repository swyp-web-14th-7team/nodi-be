import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Interest, Prisma } from '@/prisma/client';
import { FindInterestDto } from '@/module/interests/dto/find-interest.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class InterestsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(dto: FindInterestDto): Promise<PaginationResult<Interest>> {
    const { skip, limit, sort, order, search } = dto;
    const where: Prisma.InterestWhereInput = search
      ? { name: { contains: search } }
      : {};
    const [items, total] = await Promise.all([
      this.prismaService.interest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prismaService.interest.count({ where }),
    ]);
    return { items, total };
  }

  async createInterest(params: Prisma.InterestCreateInput): Promise<Interest> {
    return this.prismaService.interest.create({ data: params });
  }

  async findUnique(id: number) {
    return this.prismaService.interest.findUnique({ where: { id } });
  }

  async updateInterest(id: number, params: Prisma.InterestUpdateInput) {
    return this.prismaService.interest.update({ where: { id }, data: params });
  }

  async deleteInterest(id: number) {
    return this.prismaService.interest.delete({ where: { id } });
  }
}
