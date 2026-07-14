import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAffiliationStatusDto {
  @ApiProperty()
  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  name: string;
}
