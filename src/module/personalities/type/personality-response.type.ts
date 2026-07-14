import { ApiProperty } from '@nestjs/swagger';
import { Personality } from '@/prisma/client';

export class PersonalityResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ nullable: true })
  jobTypeId: number | null;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  static fromPersonality(item: Personality): PersonalityResponse {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      jobTypeId: item.jobTypeId,
      imageUrl: item.imageUrl,
    };
  }
}
