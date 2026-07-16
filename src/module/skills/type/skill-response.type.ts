import { ApiProperty } from '@nestjs/swagger';
import { SkillWithRelations } from '@/module/skills/skill.type';
import { SkillCategoryResponse } from '@/module/skill-categories/type/skill-category-response.type';
import { JobTypeResponse } from '@/module/job-type/type/job-type-response.type';

export class SkillResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: SkillCategoryResponse;

  @ApiProperty({ type: [JobTypeResponse], description: '이 스킬이 속한 직군' })
  jobTypes: JobTypeResponse[];

  static fromSkill(item: SkillWithRelations): SkillResponse {
    return {
      id: item.id,
      name: item.name,
      category: SkillCategoryResponse.fromCategory(item.category),
      jobTypes: item.skillJobTypes.map((skillJobType) =>
        JobTypeResponse.fromJobType(skillJobType.jobType),
      ),
    };
  }
}
