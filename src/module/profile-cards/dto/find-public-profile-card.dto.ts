import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const PUBLIC_PROFILE_CARD_SORT_FIELDS = ['createdAt', 'nickname'] as const;

export class FindPublicProfileCardDto extends PaginationDto {
  @ApiPropertyOptional({ description: '목적 필터' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  purpose?: number;

  @ApiPropertyOptional({ description: '직군 필터' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  jobTypeId?: number;

  @ApiPropertyOptional({ description: '상태 필터' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  affiliationStatusId?: number;

  @ApiPropertyOptional({ description: '검색 키워드 (닉네임 / 관심사 이름)' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({
    enum: PUBLIC_PROFILE_CARD_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsIn(PUBLIC_PROFILE_CARD_SORT_FIELDS)
  @IsOptional()
  sort: string = 'createdAt';
}
