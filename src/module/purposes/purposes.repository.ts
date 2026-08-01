import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Purpose, Prisma } from '@/prisma/client';
import { FindAllPurposesDto } from '@/module/purposes/dto/find-all-purposes.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import { CreatePurposeDto } from '@/module/purposes/dto/create-purpose.dto';
import { UpdatePurposeDto } from '@/module/purposes/dto/update-purpose.dto';

@Injectable()
export class PurposesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(dto: FindAllPurposesDto): Promise<PaginationResult<Purpose>> {
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

  async createPurpose(params: CreatePurposeDto): Promise<Purpose> {
    return this.prismaService.$transaction(async (tx) => {
      // 원하는 위치에 삽입하기 위해 그 위치부터 뒤의 항목을 한 칸씩 민다.
      await tx.purpose.updateMany({
        where: { sortOrder: { gte: params.sortOrder } },
        data: { sortOrder: { increment: 1 } },
      });
      return tx.purpose.create({ data: params });
    });
  }

  async findUnique(id: number) {
    return this.prismaService.purpose.findUnique({ where: { id } });
  }

  async updatePurpose(
    id: number,
    currentSortOrder: number,
    params: UpdatePurposeDto,
  ): Promise<Purpose> {
    return this.prismaService.$transaction(async (tx) => {
      const nextSortOrder = params.sortOrder;

      if (nextSortOrder !== undefined && nextSortOrder !== currentSortOrder) {
        if (nextSortOrder < currentSortOrder) {
          // 앞으로 이동: 새 위치부터 기존 위치 직전까지 한 칸씩 뒤로 민다.
          await tx.purpose.updateMany({
            where: {
              sortOrder: { gte: nextSortOrder, lt: currentSortOrder },
            },
            data: { sortOrder: { increment: 1 } },
          });
        } else {
          // 뒤로 이동: 기존 위치 다음부터 새 위치까지 한 칸씩 앞으로 당긴다.
          await tx.purpose.updateMany({
            where: {
              sortOrder: { gt: currentSortOrder, lte: nextSortOrder },
            },
            data: { sortOrder: { decrement: 1 } },
          });
        }
      }

      return tx.purpose.update({ where: { id }, data: params });
    });
  }

  async deletePurpose(id: number, sortOrder: number): Promise<Purpose> {
    return this.prismaService.$transaction(async (tx) => {
      const deleted = await tx.purpose.delete({ where: { id } });
      // 삭제된 위치 뒤의 항목을 당겨 빈 순서를 없앤다.
      await tx.purpose.updateMany({
        where: { sortOrder: { gt: sortOrder } },
        data: { sortOrder: { decrement: 1 } },
      });
      return deleted;
    });
  }
}
