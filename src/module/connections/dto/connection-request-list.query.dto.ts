import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

// 받은/보낸 요청함 조회용: 대상 카드 ID + 페이지네이션
export class ConnectionRequestListQueryDto extends PaginationDto {
  @ApiProperty({ description: '조회 기준이 되는 내 카드 ID (ULID, 26자)' })
  @IsString()
  @IsNotEmpty()
  @Length(26, 26)
  cardId: string;
}
