import { ApiProperty } from '@nestjs/swagger';
import { Interest } from '@/prisma/client';

export class InterestResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  static fromInterest(item: Interest): InterestResponse {
    return {
      id: item.id,
      name: item.name,
    };
  }
}
