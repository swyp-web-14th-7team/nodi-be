import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ description: '스크랩할 프로필 카드 ID (ULID, 26자)' })
  @IsString()
  @IsNotEmpty()
  @Length(26, 26)
  cardId: string;

  @ApiProperty({ description: '담을 보관함(그룹) ID' })
  @IsInt()
  @Min(1)
  groupId: number;
}
