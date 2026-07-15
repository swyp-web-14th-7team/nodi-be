import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @Length(1, 255)
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  nickname?: string;
}
