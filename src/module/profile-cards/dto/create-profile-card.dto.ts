import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProfileCardDto {
  @ApiProperty({ description: '직군(jobType) ID (number)' })
  @Min(1)
  @IsNumber()
  jobTypeId: number;

  @ApiPropertyOptional({ description: '목적 ID (팀 빌딩/친목/커피챗 등)' })
  @Min(1)
  @IsNumber()
  @IsOptional()
  purposeId?: number;
}
