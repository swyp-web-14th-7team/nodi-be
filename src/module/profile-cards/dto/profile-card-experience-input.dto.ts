import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class ProfileCardExperienceInputDto {
  @ApiProperty({ description: '경험 제목', maxLength: 500 })
  @Length(2, 500)
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '경험 설명', maxLength: 2000 })
  @Length(2, 2000)
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: '관련 url',
    maxLength: 500,
    nullable: true,
  })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @MaxLength(500)
  @IsUrl()
  @IsString()
  @IsOptional()
  relatedUrl?: string | null;

  @ApiProperty({
    description:
      '정렬 순서 (프론트 표시 순서). 대표 경험은 0, 나머지는 1부터 시작',
    minimum: 0,
    maximum: 10,
  })
  @Max(10)
  @Min(0)
  @IsInt()
  sortOrder: number;
}
