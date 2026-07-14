import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const PERSONALITY_SORT_FIELDS = ['id', 'name'] as const;

export class FindPersonalityDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'name 검색어 (부분 일치)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'jobTypeId 필터' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  jobTypeId?: number;

  // PaginationDto.sort 오버라이드: 허용 컬럼만, 기본값 name (personality 는 createdAt 없음)
  @ApiPropertyOptional({ enum: PERSONALITY_SORT_FIELDS, default: 'name' })
  @IsIn(PERSONALITY_SORT_FIELDS)
  @IsOptional()
  sort: string = 'name';
}
