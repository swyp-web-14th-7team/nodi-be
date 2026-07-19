import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollectionsRepository } from '@/module/collections/collections.repository';
import { CollectionGroup, Prisma, User, UserCollection } from '@/prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import {
  CollectionGroupWithCount,
  CollectionWithCard,
} from '@/module/collections/collections.type';
import { CreateCollectionGroupDto } from '@/module/collections/dto/create-collection-group.dto';
import { UpdateCollectionGroupDto } from '@/module/collections/dto/update-collection-group.dto';
import { CreateCollectionDto } from '@/module/collections/dto/create-collection.dto';
import { UpdateCollectionDto } from '@/module/collections/dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly collectionsRepository: CollectionsRepository) {}

  // ------------------- 보관함(그룹) -------------------

  async createGroup(
    user: User,
    dto: CreateCollectionGroupDto,
  ): Promise<CollectionGroupWithCount> {
    try {
      return await this.collectionsRepository.createGroup(user.id, dto.name);
    } catch (e) {
      throw this.mapGroupNameConflict(e);
    }
  }

  async findGroups(user: User): Promise<CollectionGroupWithCount[]> {
    return this.collectionsRepository.findManyGroups(user.id);
  }

  async updateGroup(
    user: User,
    groupId: number,
    dto: UpdateCollectionGroupDto,
  ): Promise<CollectionGroupWithCount> {
    await this.getOwnedGroup(user, groupId);
    try {
      return await this.collectionsRepository.updateGroup(groupId, dto.name);
    } catch (e) {
      throw this.mapGroupNameConflict(e);
    }
  }

  async deleteGroup(user: User, groupId: number): Promise<void> {
    await this.getOwnedGroup(user, groupId);
    await this.collectionsRepository.deleteGroup(groupId);
  }

  async findGroupItems(
    user: User,
    groupId: number,
    pagination: PaginationDto,
  ): Promise<PaginationResult<CollectionWithCard>> {
    await this.getOwnedGroup(user, groupId);
    return this.collectionsRepository.findManyByGroup(groupId, pagination);
  }

  // ------------------- 스크랩(아이템) -------------------

  async createCollection(
    user: User,
    dto: CreateCollectionDto,
  ): Promise<CollectionWithCard> {
    // 담을 보관함이 본인 소유인지 먼저 검증
    await this.getOwnedGroup(user, dto.groupId);
    try {
      return await this.collectionsRepository.createCollection(
        user.id,
        dto.groupId,
        dto.cardId,
      );
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // (userId, cardId) 유니크 위반 → 이미 스크랩한 카드
        if (e.code === 'P2002')
          throw new ConflictException('이미 스크랩한 카드입니다.');
        // card_id FK 위반 → 존재하지 않는 카드
        if (e.code === 'P2003')
          throw new BadRequestException('존재하지 않는 프로필 카드입니다.');
      }
      throw e;
    }
  }

  async moveCollection(
    user: User,
    id: number,
    dto: UpdateCollectionDto,
  ): Promise<CollectionWithCard> {
    await this.getOwnedCollection(user, id);
    // 이동 대상 보관함도 본인 소유인지 검증
    await this.getOwnedGroup(user, dto.groupId);
    return this.collectionsRepository.updateCollectionGroup(id, dto.groupId);
  }

  async deleteCollection(user: User, id: number): Promise<void> {
    await this.getOwnedCollection(user, id);
    await this.collectionsRepository.deleteCollection(id);
  }

  // ------------------- 소유자 검증 helper -------------------

  private async getOwnedGroup(
    user: User,
    groupId: number,
  ): Promise<CollectionGroup> {
    const group: CollectionGroup | null =
      await this.collectionsRepository.findUniqueGroup(groupId);
    if (!group || group.userId !== user.id)
      throw new NotFoundException('보관함을 찾을 수 없습니다.');
    return group;
  }

  private async getOwnedCollection(
    user: User,
    id: number,
  ): Promise<UserCollection> {
    const collection: UserCollection | null =
      await this.collectionsRepository.findUniqueCollection(id);
    if (!collection || collection.userId !== user.id)
      throw new NotFoundException('스크랩을 찾을 수 없습니다.');
    return collection;
  }

  /** 보관함 이름 유니크(userId, name) 위반을 409 로 변환 */
  private mapGroupNameConflict(e: unknown): unknown {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return new ConflictException('이미 존재하는 보관함 이름입니다.');
    return e;
  }
}
