import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const SKILL_SORT_FIELDS = ['id', 'name'] as const;

export class FindSkillsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '카테고리 ID 로 필터 (생략 시 전체 조회)',
  })
  @Type(() => Number) // 쿼리스트링은 문자열이라 number 로 변환
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'name 검색어 (부분 일치)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: SKILL_SORT_FIELDS, default: 'name' })
  @IsIn(SKILL_SORT_FIELDS)
  @IsOptional()
  sort: string = 'name';
}
