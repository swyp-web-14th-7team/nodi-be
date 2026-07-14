import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdatePersonalityDto {
  @ApiPropertyOptional()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Length(1, 2000)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

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
