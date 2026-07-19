import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCollectionDto {
  @ApiProperty({ description: '이동할 보관함(그룹) ID' })
  @IsInt()
  @Min(1)
  groupId: number;
}
