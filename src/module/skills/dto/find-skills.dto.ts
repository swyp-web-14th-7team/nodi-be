import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindSkillsDto {
  @ApiPropertyOptional({
    description: '카테고리 ID 로 필터 (생략 시 전체 조회)',
  })
  @Type(() => Number) // 쿼리스트링은 문자열이라 number 로 변환
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;
}
