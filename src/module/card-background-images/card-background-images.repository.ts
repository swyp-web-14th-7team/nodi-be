import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { CardBackgroundImage, Prisma } from '@/prisma/client';
import { FindCardBackgroundImageDto } from '@/module/card-background-images/dto/find-card-background-image.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class CardBackgroundImagesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(
    dto: FindCardBackgroundImageDto,
  ): Promise<PaginationResult<CardBackgroundImage>> {
    const { skip, limit, sort, order } = dto;
    const [items, total] = await Promise.all([
      this.prismaService.cardBackgroundImage.findMany({
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prismaService.cardBackgroundImage.count(),
    ]);
    return { items, total };
  }

  async create(
    params: Prisma.CardBackgroundImageCreateInput,
  ): Promise<CardBackgroundImage> {
    return this.prismaService.cardBackgroundImage.create({ data: params });
  }

  async findUnique(id: number): Promise<CardBackgroundImage | null> {
    return this.prismaService.cardBackgroundImage.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<CardBackgroundImage> {
    return this.prismaService.cardBackgroundImage.delete({ where: { id } });
  }
}
