import { ApiProperty } from '@nestjs/swagger';
import { Purpose } from '@/prisma/client';

export class PurposeResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: '표시 순서', minimum: 0 })
  sortOrder: number;

  static fromPurpose(item: Purpose): PurposeResponse {
    return {
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
    };
  }
}
