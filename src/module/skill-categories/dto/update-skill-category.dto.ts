import { PartialType } from '@nestjs/swagger';
import { CreateSkillCategoryDto } from '@/module/skill-categories/dto/create-skill-category.dto';

// name optional (PATCH 부분 수정)
export class UpdateSkillCategoryDto extends PartialType(
  CreateSkillCategoryDto,
) {}
