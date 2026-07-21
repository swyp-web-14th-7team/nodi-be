import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CardBackgroundImagesService } from '@/module/card-background-images/card-background-images.service';
import { CardBackgroundImage } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { PaginationType } from '@/common/type/pagination.type';
import { CreateCardBackgroundImageDto } from '@/module/card-background-images/dto/create-card-background-image.dto';
import { FindCardBackgroundImageDto } from '@/module/card-background-images/dto/find-card-background-image.dto';
import { CardBackgroundImageResponse } from '@/module/card-background-images/type/card-background-image-response.type';

@Controller('card-background-images')
export class CardBackgroundImagesController {
  constructor(
    private readonly cardBackgroundImagesService: CardBackgroundImagesService,
  ) {}

  /**
   * 카드 배경 이미지 목록 조회
   * @remarks
   * 등록된 카드 배경 이미지를 페이지네이션으로 조회합니다.
   * 각 항목의 imageUrl 은 base URL 이며, 실제 이미지는 `${imageUrl}/282x400.webp` 처럼 접근합니다.
   *
   * **요청 query**
   * - page, limit, order: 페이지네이션 옵션
   * - sort: 정렬 컬럼 (id·createdAt, 기본 createdAt)
   * @param dto
   */
  @Get()
  @ApiResponsePagination(CardBackgroundImageResponse)
  async findAll(
    @Query() dto: FindCardBackgroundImageDto,
  ): Promise<PaginationType<CardBackgroundImageResponse>> {
    const { items, total } =
      await this.cardBackgroundImagesService.findMany(dto);
    return {
      items: items.map((item) =>
        CardBackgroundImageResponse.fromCardBackgroundImage(item),
      ),
      metadata: { ...dto, total },
    };
  }

  /**
   * 카드 배경 이미지 등록 (ADMIN)
   * @remarks
   * 업로드 API(`POST /files/card-background-image/upload`)가 반환한 base URL 을
   * 카드 배경 선택지로 등록합니다.
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(CardBackgroundImageResponse, { status: 201 })
  async create(
    @Body() dto: CreateCardBackgroundImageDto,
  ): Promise<CardBackgroundImageResponse> {
    const data: CardBackgroundImage =
      await this.cardBackgroundImagesService.create(dto);
    return CardBackgroundImageResponse.fromCardBackgroundImage(data);
  }
}
