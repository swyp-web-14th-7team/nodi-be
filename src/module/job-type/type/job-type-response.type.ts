import { ApiProperty } from '@nestjs/swagger';
import { JobType } from '@/prisma/client';

export class JobTypeResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, description: '아이콘 url' })
  imageUrl: string | null;

  static fromJobType(item: JobType): JobTypeResponse {
    return {
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
    };
  }
}
