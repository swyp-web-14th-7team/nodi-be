import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCardBackgroundImageDto {
  @ApiProperty({
    description:
      '업로드 API 가 반환한 base URL (뒤에 /origin.webp · /282x400.webp 붙여 접근)',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  imageUrl: string;
}
