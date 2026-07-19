import { ApiProperty } from '@nestjs/swagger';
import { CollectionGroupWithCount } from '@/module/collections/collections.type';

export class CollectionGroupResponse {
  @ApiProperty({ description: '보관함(그룹) ID' })
  id: number;

  @ApiProperty({ description: '보관함 이름' })
  name: string;

  @ApiProperty({ description: '보관함에 담긴 스크랩 수' })
  itemCount: number;

  static fromGroup(item: CollectionGroupWithCount): CollectionGroupResponse {
    return {
      id: item.id,
      name: item.name,
      itemCount: item._count.userCollections,
    };
  }
}
