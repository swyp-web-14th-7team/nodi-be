import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const CARD_BACKGROUND_IMAGE_SORT_FIELDS = ['id', 'createdAt'] as const;

export class FindCardBackgroundImageDto extends PaginationDto {
  // PaginationDto.sort 오버라이드: 허용 컬럼만 (id·createdAt), 기본값 createdAt
  @ApiPropertyOptional({
    enum: CARD_BACKGROUND_IMAGE_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsIn(CARD_BACKGROUND_IMAGE_SORT_FIELDS)
  @IsOptional()
  sort: string = 'createdAt';
}
