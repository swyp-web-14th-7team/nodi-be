import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const PURPOSE_SORT_FIELDS = ['id', 'name', 'sortOrder'] as const;

export class FindPurposeDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'name 검색어 (부분 일치)' })
  @IsString()
  @IsOptional()
  search?: string;

  // PaginationDto.sort 오버라이드: 허용 컬럼만, 기본값 sortOrder (purpose 는 createdAt 없음)
  @ApiPropertyOptional({ enum: PURPOSE_SORT_FIELDS, default: 'sortOrder' })
  @IsIn(PURPOSE_SORT_FIELDS)
  @IsOptional()
  sort: string = 'sortOrder';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  order: 'asc' | 'desc' = 'asc';
}
