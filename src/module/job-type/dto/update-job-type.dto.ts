import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateJobTypeDto {
  @ApiPropertyOptional()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}
