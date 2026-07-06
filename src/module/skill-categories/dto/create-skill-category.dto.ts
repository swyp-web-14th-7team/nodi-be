import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSkillCategoryDto {
  @ApiProperty({ description: '스킬 카테고리 이름 (고유)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
