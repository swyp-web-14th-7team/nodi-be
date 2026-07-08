import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const INTEREST_SORT_FIELDS = ['id', 'name'] as const;

export class FindInterestDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'name 검색어 (부분 일치)' })
  @IsString()
  @IsOptional()
  search?: string;

  // PaginationDto.sort 오버라이드: 허용 컬럼만, 기본값 name (interest 는 createdAt 없음)
  @ApiPropertyOptional({ enum: INTEREST_SORT_FIELDS, default: 'name' })
  @IsIn(INTEREST_SORT_FIELDS)
  @IsOptional()
  sort: string = 'name';
}
