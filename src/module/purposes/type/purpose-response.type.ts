import { ApiProperty } from '@nestjs/swagger';
import { Purpose } from '@/prisma/client';

export class PurposeResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  static fromPurpose(item: Purpose): PurposeResponse {
    return {
      id: item.id,
      name: item.name,
    };
  }
}
