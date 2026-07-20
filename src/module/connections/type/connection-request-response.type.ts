import { ApiProperty } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import {
  ReceivedConnectionRequest,
  SentConnectionRequest,
} from '@/module/connections/connection-request.type';
import { ConnectionRequestStatus } from '@/module/connections/type/connection-request-status.enum';

export class ConnectionRequestResponse {
  @ApiProperty({ description: '연결 요청 ID (ULID)' })
  id: string;

  @ApiProperty({
    enum: ConnectionRequestStatus,
    description: '0: 대기, 1: 수락, 2: 거절, 3: 취소',
  })
  status: number;

  @ApiProperty({ nullable: true, description: '연결 요청 첨부 메시지' })
  message: string | null;

  @ApiProperty({
    type: ProfileCardResponse,
    description:
      '상대 카드. 받은 요청함이면 요청을 보낸 카드, 보낸 요청함이면 요청을 받은 카드.',
  })
  card: ProfileCardResponse;

  @ApiProperty()
  createdAt: FormattedDate;

  // 받은 요청함: 상대 = requesterCard
  static fromReceived(
    item: ReceivedConnectionRequest,
  ): ConnectionRequestResponse {
    return {
      id: item.id,
      status: item.status,
      message: item.message,
      card: ProfileCardResponse.fromProfileCard(item.requesterCard),
      createdAt: FormattedDate.fromDate(item.createdAt),
    };
  }

  // 보낸 요청함: 상대 = receiverCard
  static fromSent(item: SentConnectionRequest): ConnectionRequestResponse {
    return {
      id: item.id,
      status: item.status,
      message: item.message,
      card: ProfileCardResponse.fromProfileCard(item.receiverCard),
      createdAt: FormattedDate.fromDate(item.createdAt),
    };
  }
}
