import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

const PURPOSE_SORT_FIELDS = ['id', 'name'] as const;

export class FindPurposeDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'name 검색어 (부분 일치)' })
  @IsString()
  @IsOptional()
  search?: string;

  // PaginationDto.sort 오버라이드: 허용 컬럼만, 기본값 name (purpose 는 createdAt 없음)
  @ApiPropertyOptional({ enum: PURPOSE_SORT_FIELDS, default: 'name' })
  @IsIn(PURPOSE_SORT_FIELDS)
  @IsOptional()
  sort: string = 'name';
}
