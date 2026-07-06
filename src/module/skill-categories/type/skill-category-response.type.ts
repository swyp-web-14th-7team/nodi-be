import { ApiProperty } from '@nestjs/swagger';
import { SkillCategory } from '@/prisma/client';

export class SkillCategoryResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  static fromCategory(item: SkillCategory): SkillCategoryResponse {
    return {
      id: item.id,
      name: item.name,
    };
  }
}
