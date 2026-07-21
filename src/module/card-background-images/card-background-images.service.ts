import { Injectable } from '@nestjs/common';
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
}
