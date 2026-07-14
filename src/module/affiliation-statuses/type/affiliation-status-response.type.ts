import { ApiProperty } from '@nestjs/swagger';
import { AffiliationStatus } from '@/prisma/client';

export class AffiliationStatusResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  static fromAffiliationStatus(
    item: AffiliationStatus,
  ): AffiliationStatusResponse {
    return {
      id: item.id,
      name: item.name,
    };
  }
}
