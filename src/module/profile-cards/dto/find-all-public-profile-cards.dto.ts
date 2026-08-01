import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const PUBLIC_PROFILE_CARD_SORT_FIELDS = ['createdAt', 'nickname'] as const;

export class FindAllPublicProfileCardsDto extends PaginationDto {
  @ApiPropertyOptional({ description: '목적 필터' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  purposeId?: number;

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

  @ApiPropertyOptional({
    description: '스킬 ID 필터 (배열, 하나라도 보유한 카드 조회)',
    type: [Number],
  })
  // 쿼리스트링: 단일 값("1") / 콤마 구분("1,2") / 반복 키(skillIds=1&skillIds=2) 모두 배열로 정규화
  @Transform(({ value }) => {
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw.map((v) => Number(v));
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  @IsOptional()
  skillIds?: number[];

  @ApiPropertyOptional({ description: '검색 키워드 (닉네임 / 관심사 이름)' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({
    description:
      '정렬 기준. createdAt = 최신순, nickname = 닉네임 가나다순 (기본값 createdAt)',
    enum: PUBLIC_PROFILE_CARD_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsIn(PUBLIC_PROFILE_CARD_SORT_FIELDS)
  @IsOptional()
  sort: string = 'createdAt';
}
