import { PartialType } from '@nestjs/swagger';
import { CreateSkillDto } from '@/module/skills/dto/create-skill.dto';

// name / categoryId 모두 optional (PATCH 부분 수정)
export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
