import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class TemplateItemDto {
  @ApiProperty({ description: '항목 이름' })
  @IsString()
  @Length(1, 255)
  label: string;

  @ApiProperty({ description: '항목 설명' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: '항목 타입 (0: SHORT_TEXT, 1: LONG_TEXT, 2: LINK, 3: NUMBER)',
  })
  @IsInt()
  @Min(0)
  @Max(3)
  type: number;
}
