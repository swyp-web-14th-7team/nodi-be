import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ description: '스킬 이름 (고유)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '스킬 카테고리 ID' })
  @IsInt()
  @Min(1)
  categoryId: number;
}
