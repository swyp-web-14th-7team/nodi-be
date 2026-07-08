import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetadata {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ description: '정렬한 필드명' })
  sort: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  order: 'asc' | 'desc';

  @ApiProperty({ description: '전체 데이터 수' })
  total: number;
}

export class PaginationType<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty()
  metadata: PaginationMetadata;
}
