import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCollectionGroupDto {
  @ApiProperty({ description: '보관함(그룹) 이름', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;
}
