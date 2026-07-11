import { ApiProperty } from '@nestjs/swagger';
import { JobType } from '@/prisma/client';

export class JobTypeResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  static fromJobType(item: JobType): JobTypeResponse {
    return {
      id: item.id,
      name: item.name,
    };
  }
}
