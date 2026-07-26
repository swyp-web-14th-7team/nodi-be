import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreatePurposeDto {
  @ApiProperty()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '표시 순서', minimum: 0 })
  @Min(0)
  @IsInt()
  sortOrder: number;
}
