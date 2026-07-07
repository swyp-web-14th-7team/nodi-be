import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProfileCardDto {
  @ApiProperty({ description: '템플릿 ID (number)' })
  @Min(1)
  @IsNumber()
  templateId: number;

  @ApiPropertyOptional({ description: '프로필 카드 이미지 URL' })
  @Length(10, 500)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cardImageUrl?: string;
}
