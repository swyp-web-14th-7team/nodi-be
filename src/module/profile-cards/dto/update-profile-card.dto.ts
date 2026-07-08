import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProfileCardDto {
  @ApiPropertyOptional({ description: '스킬 ID 목록', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  skillIds?: number[];

  @ApiPropertyOptional({ description: '관심사 ID 목록', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  interestIds?: number[];

  @ApiPropertyOptional({ description: '개성 ID (카드당 하나만 선택)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  personalityId?: number;

  @ApiPropertyOptional({ description: '한 줄 소개' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;

  // TODO: 현 소속 기획도 추후 추가 예정
}
