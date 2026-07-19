import { ApiProperty } from '@nestjs/swagger';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import { CollectionWithCard } from '@/module/collections/collections.type';

export class CollectionResponse {
  @ApiProperty({ description: '스크랩 ID' })
  id: number;

  @ApiProperty({ description: '담긴 보관함(그룹) ID' })
  groupId: number;

  @ApiProperty({
    description: '스크랩된 프로필 카드',
    type: ProfileCardResponse,
  })
  card: ProfileCardResponse;

  static fromCollection(item: CollectionWithCard): CollectionResponse {
    return {
      id: item.id,
      groupId: item.groupId,
      card: ProfileCardResponse.fromProfileCard(item.card),
    };
  }
}
