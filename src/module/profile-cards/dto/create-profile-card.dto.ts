import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateProfileCardDto {
  @ApiProperty({ description: '템플릿 ID (number)' })
  @Min(1)
  @IsNumber()
  templateId: number;

  @ApiProperty({
    description: '온보딩 시에만 isDefault: true, 나머지 경우 false',
    default: false,
  })
  @IsBoolean()
  isDefault: boolean;
}
