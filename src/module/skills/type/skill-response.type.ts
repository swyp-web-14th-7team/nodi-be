import { ApiProperty } from '@nestjs/swagger';
import { SkillWithCategory } from '@/module/skills/skill.type';

export class SkillResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  categoryId: number;

  @ApiProperty()
  categoryName: string;

  static fromSkill(item: SkillWithCategory): SkillResponse {
    return {
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.category.name,
    };
  }
}
