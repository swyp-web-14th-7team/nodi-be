import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { CollectionGroup, Prisma, UserCollection } from '@/prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import {
  CollectionGroupWithCount,
  collectionGroupWithCountIncludeOptions,
  CollectionWithCard,
  collectionWithCardIncludeOptions,
} from '@/module/collections/collections.type';

@Injectable()
export class CollectionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ------------------- 보관함(그룹) -------------------

  async createGroup(
    userId: string,
    name: string,
  ): Promise<CollectionGroupWithCount> {
    return this.prismaService.collectionGroup.create({
      data: { userId, name },
      include: collectionGroupWithCountIncludeOptions,
    });
  }

  /** 유저의 보관함 목록 (각 보관함의 스크랩 수 포함) */
  async findManyGroups(userId: string): Promise<CollectionGroupWithCount[]> {
    return this.prismaService.collectionGroup.findMany({
      where: { userId },
      include: collectionGroupWithCountIncludeOptions,
      orderBy: { id: 'asc' },
    });
  }

  async findUniqueGroup(id: number): Promise<CollectionGroup | null> {
    return this.prismaService.collectionGroup.findUnique({ where: { id } });
  }

  async updateGroup(
    id: number,
    name: string,
  ): Promise<CollectionGroupWithCount> {
    return this.prismaService.collectionGroup.update({
      where: { id },
      data: { name },
      include: collectionGroupWithCountIncludeOptions,
    });
  }

  /** 보관함 삭제. 담긴 스크랩(user_collections)은 onDelete: Cascade 로 함께 삭제된다. */
  async deleteGroup(id: number): Promise<void> {
    await this.prismaService.collectionGroup.delete({ where: { id } });
  }

  // ------------------- 스크랩(아이템) -------------------

  /**
   * 보관함 내 스크랩 목록 (카드 전체 포함, 페이지네이션)
   * user_collections 에는 createdAt 컬럼이 없어 삽입순(id)으로 정렬한다.
   */
  async findManyByGroup(
    groupId: number,
    { skip, limit, order }: PaginationDto,
  ): Promise<PaginationResult<CollectionWithCard>> {
    const where: Prisma.UserCollectionWhereInput = { groupId };
    const [total, items] = await Promise.all([
      this.prismaService.userCollection.count({ where }),
      this.prismaService.userCollection.findMany({
        where,
        include: collectionWithCardIncludeOptions,
        skip,
        take: limit,
        orderBy: { id: order },
      }),
    ]);
    return { total, items };
  }

  async createCollection(
    userId: string,
    groupId: number,
    cardId: string,
  ): Promise<CollectionWithCard> {
    return this.prismaService.userCollection.create({
      data: { userId, groupId, cardId },
      include: collectionWithCardIncludeOptions,
    });
  }

  async findUniqueCollection(id: number): Promise<UserCollection | null> {
    return this.prismaService.userCollection.findUnique({ where: { id } });
  }

  /** 스크랩을 다른 보관함으로 이동 */
  async updateCollectionGroup(
    id: number,
    groupId: number,
  ): Promise<CollectionWithCard> {
    return this.prismaService.userCollection.update({
      where: { id },
      data: { groupId },
      include: collectionWithCardIncludeOptions,
    });
  }

  async deleteCollection(id: number): Promise<void> {
    await this.prismaService.userCollection.delete({ where: { id } });
  }
}
