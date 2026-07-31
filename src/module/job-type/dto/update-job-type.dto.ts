import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateJobTypeDto {
  @ApiPropertyOptional()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description:
      '아이콘 url, null 이면 기존 이미지를 제거하는 것으로, undefined (미포함) 이면 수정하지 않음',
    nullable: true,
  })
  @IsUrl()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  imageUrl?: string | null;
}
