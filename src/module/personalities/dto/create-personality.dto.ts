import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreatePersonalityDto {
  @ApiProperty()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @Length(1, 2000)
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  jobTypeId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Length(1, 500)
  imageUrl?: string;
}
