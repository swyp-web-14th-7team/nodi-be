import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Transform, TransformFnParams } from 'class-transformer';

const NOTIFICATIONS_SORT_FIELDS = ['createdAt'] as const;

export class FindAllNotificationsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsIn(NOTIFICATIONS_SORT_FIELDS)
  @IsOptional()
  sort: string = 'createdAt';

  @ApiPropertyOptional({ type: 'boolean', description: '읽음 여부 필터링' })
  @Transform(({ value }: TransformFnParams): unknown => {
    const raw: unknown = value;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return raw;
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
