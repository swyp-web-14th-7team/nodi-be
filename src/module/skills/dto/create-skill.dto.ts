import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

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

  @ApiProperty({
    type: [Number],
    description:
      '이 스킬이 속한 직군 ID 목록. 전 직군 공통 스킬이면 모든 직군 ID 를 넣습니다. ' +
      '(빈 배열 불가 — 매핑이 없는 상태는 "아직 지정하지 않음" 과 구분되지 않습니다)',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  jobTypeIds: number[];
}
