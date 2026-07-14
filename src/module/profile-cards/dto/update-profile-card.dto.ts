import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
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

  @ApiPropertyOptional({ description: '소속 상태' })
  @Min(1)
  @IsNumber()
  @IsOptional()
  affiliationStatusId?: number;

  @ApiPropertyOptional({ description: '소속 명칭' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  affiliation?: string;

  @ApiPropertyOptional({ description: '프로필 카드 이미지 URL' })
  @Length(10, 500)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cardImageUrl?: string;

  @ApiPropertyOptional({ description: '프로필 이미지 URL' })
  @Length(10, 500)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  profileImageUrl?: string;
}
