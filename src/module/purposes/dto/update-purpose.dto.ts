import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdatePurposeDto {
  @ApiPropertyOptional()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '표시 순서', minimum: 0 })
  @Min(0)
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
