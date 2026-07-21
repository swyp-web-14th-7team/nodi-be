import { ApiProperty } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';
import { CardConnection } from '@/prisma/client';

// 스냅샷은 Json 컬럼이라 Date 가 문자열로 저장된다.
// ProfileCardResponse.fromProfileCard 가 Date 메서드(toISOString 등)를 호출하므로
// 카드로 렌더하기 전에 Date 필드를 되살린다.
const reviveCardSnapshot = (
  snapshot: CardConnection['requesterCardSnapshot'],
): DisplayProfileCard => {
  const card = snapshot as unknown as DisplayProfileCard;
  return {
    ...card,
    createdAt: new Date(card.createdAt),
    updatedAt: new Date(card.updatedAt),
  };
};

export class ConnectionResponse {
  @ApiProperty({ description: '연결(보관) ID (ULID)' })
  id: string;

  @ApiProperty({
    type: ProfileCardResponse,
    description: '연결된 상대 카드 (성립 시점 스냅샷)',
  })
  card: ProfileCardResponse;

  @ApiProperty({ nullable: true, description: '연결 요청 시 첨부한 메시지' })
  message: string | null;

  @ApiProperty({ description: '연결 성립 시각' })
  connectedAt: FormattedDate;

  // 내 관점(myUserId)에서 상대 카드 스냅샷을 골라 응답을 만든다.
  // 내가 요청자면 상대는 receiver, 내가 수신자면 상대는 requester.
  static fromConnection(
    connection: CardConnection,
    myUserId: string,
  ): ConnectionResponse {
    const counterpartSnapshot =
      connection.requesterUserId === myUserId
        ? connection.receiverCardSnapshot
        : connection.requesterCardSnapshot;
    return {
      id: connection.id,
      card: ProfileCardResponse.fromProfileCard(
        reviveCardSnapshot(counterpartSnapshot),
      ),
      message: connection.message,
      connectedAt: FormattedDate.fromDate(connection.connectedAt),
    };
  }
}
