import { ApiProperty } from '@nestjs/swagger';
import { Interest } from '@/prisma/client';

export class ProfileCardInterestResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  static fromInterest(item: Interest): ProfileCardInterestResponse {
    return {
      id: item.id,
      name: item.name,
    };
  }
}
