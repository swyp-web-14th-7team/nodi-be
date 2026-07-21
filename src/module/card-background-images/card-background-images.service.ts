import { Injectable, NotFoundException } from '@nestjs/common';
import { CardBackgroundImagesRepository } from '@/module/card-background-images/card-background-images.repository';
import { CardBackgroundImage } from '@/prisma/client';
import { CreateCardBackgroundImageDto } from '@/module/card-background-images/dto/create-card-background-image.dto';
import { FindCardBackgroundImageDto } from '@/module/card-background-images/dto/find-card-background-image.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class CardBackgroundImagesService {
  constructor(
    private readonly cardBackgroundImagesRepository: CardBackgroundImagesRepository,
  ) {}

  async findMany(
    dto: FindCardBackgroundImageDto,
  ): Promise<PaginationResult<CardBackgroundImage>> {
    return this.cardBackgroundImagesRepository.findMany(dto);
  }

  async create(
    dto: CreateCardBackgroundImageDto,
  ): Promise<CardBackgroundImage> {
    return this.cardBackgroundImagesRepository.create(dto);
  }

  async delete(id: number): Promise<CardBackgroundImage> {
    await this.findByIdOrThrow(id);
    return this.cardBackgroundImagesRepository.delete(id);
  }

  private async findByIdOrThrow(id: number): Promise<CardBackgroundImage> {
    const target = await this.cardBackgroundImagesRepository.findUnique(id);
    if (!target) {
      throw new NotFoundException('카드 배경 이미지를 찾을 수 없습니다.');
    }
    return target;
  }
}
