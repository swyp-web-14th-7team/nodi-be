import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ProfileCardExperienceInputDto {
  @ApiProperty({ description: '경험 제목', maxLength: 500 })
  @Length(2, 500)
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '경험 설명', maxLength: 2000 })
  @Length(2, 2000)
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: '관련 url', maxLength: 500 })
  @MaxLength(500)
  @IsUrl()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  relatedUrl?: string;

  @ApiProperty({
    description:
      '정렬 순서 (그냥 프론트애서 표시 순서), 대표이면 1이고, 그렇지 않다면 2부터 시작',
  })
  @Max(10)
  @Min(1)
  @IsInt()
  sortOrder: number;
}
