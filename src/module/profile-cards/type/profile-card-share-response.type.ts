import { ApiProperty } from '@nestjs/swagger';

/**
 * 카드 소유자에게만 반환하는 QR 공유 토큰.
 * 공개 응답(ProfileCardResponse)에는 절대 포함되면 안 된다 —
 * 목록 API 로 새어나가는 순간 비공개 카드가 전부 열린다.
 */
export class ProfileCardShareResponse {
  @ApiProperty({ description: 'QR 공유 토큰 (소유자 전용)' })
  shareToken: string;

  static fromShareToken(shareToken: string): ProfileCardShareResponse {
    return { shareToken };
  }
}
