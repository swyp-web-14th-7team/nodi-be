import { ApiProperty } from '@nestjs/swagger';
import { SkillWithCategory } from '@/module/skills/skill.type';
import { SkillCategoryResponse } from '@/module/skill-categories/type/skill-category-response.type';

export class SkillResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: SkillCategoryResponse;

  static fromSkill(item: SkillWithCategory): SkillResponse {
    return {
      id: item.id,
      name: item.name,
      category: SkillCategoryResponse.fromCategory(item.category),
    };
  }
}
