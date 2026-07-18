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
  @ApiProperty()
  @Length(2, 500)
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @Length(2, 2000)
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
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
