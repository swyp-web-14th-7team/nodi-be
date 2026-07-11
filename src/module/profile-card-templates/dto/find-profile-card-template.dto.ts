import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const TEMPLATE_SORT_FIELDS = ['id', 'version'] as const;

export class FindProfileCardTemplateDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '직군(jobType) ID 로 필터 (생략 시 전체 조회)',
  })
  @Type(() => Number) // 쿼리스트링은 문자열이라 number 로 변환
  @IsOptional()
  @IsInt()
  @Min(1)
  jobTypeId?: number;

  // PaginationDto.sort 오버라이드: 템플릿은 createdAt 이 없어 id·version 만 허용, 기본값 id
  @ApiPropertyOptional({ enum: TEMPLATE_SORT_FIELDS, default: 'id' })
  @IsIn(TEMPLATE_SORT_FIELDS)
  @IsOptional()
  sort: string = 'id';
}