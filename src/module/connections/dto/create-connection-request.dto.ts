import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateConnectionRequestDto {
  @ApiProperty({ description: '요청을 보내는 내 카드 ID (ULID, 26자)' })
  @IsString()
  @IsNotEmpty()
  @Length(26, 26)
  requesterCardId: string;

  @ApiProperty({ description: '요청을 받는 상대 카드 ID (ULID, 26자)' })
  @IsString()
  @IsNotEmpty()
  @Length(26, 26)
  receiverCardId: string;

  @ApiPropertyOptional({ description: '연결 요청 첨부 메시지 (최대 500자)' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}
