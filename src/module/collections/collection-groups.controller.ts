import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { CollectionsService } from '@/module/collections/collections.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationType } from '@/common/type/pagination.type';
import { CreateCollectionGroupDto } from '@/module/collections/dto/create-collection-group.dto';
import { UpdateCollectionGroupDto } from '@/module/collections/dto/update-collection-group.dto';
import { CollectionGroupResponse } from '@/module/collections/type/collection-group-response.type';
import { CollectionResponse } from '@/module/collections/type/collection-response.type';

@Controller('collection-groups')
export class CollectionGroupsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * 보관함(그룹) 생성
   * @remarks
   * 로그인한 유저의 새 보관함을 생성합니다. 이름은 유저별로 유일하며,
   * 중복되면 409 를 반환합니다.
   * @param user
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(CollectionGroupResponse, { status: 201 })
  @ApiConflictResponse({ description: '이미 존재하는 보관함 이름입니다.' })
  async createCollectionGroup(
    @CurrentUser() user: User,
    @Body() dto: CreateCollectionGroupDto,
  ): Promise<CollectionGroupResponse> {
    const group = await this.collectionsService.createGroup(user, dto);
    return CollectionGroupResponse.fromGroup(group);
  }

  /**
   * 보관함(그룹) 목록 조회
   * @remarks
   * 로그인한 유저의 보관함 목록을 반환합니다. 각 보관함에는 담긴 스크랩 수(itemCount)가 포함됩니다.
   * 보관함 내부의 카드 목록은 `GET /collection-groups/{groupId}/items` 로 조회하세요.
   * @param user
   */
  @Get()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(CollectionGroupResponse, { isArray: true })
  async getCollectionGroups(
    @CurrentUser() user: User,
  ): Promise<CollectionGroupResponse[]> {
    const groups = await this.collectionsService.findGroups(user);
    return groups.map((group) => CollectionGroupResponse.fromGroup(group));
  }

  /**
   * 보관함 내 스크랩 목록 조회
   * @remarks
   * 특정 보관함에 담긴 스크랩(프로필 카드) 목록을 페이지네이션으로 조회합니다.
   * 본인 소유 보관함이 아니거나 존재하지 않으면 404 를 반환합니다.
   *
   * ★ 각 카드는 단건 조회와 동일한 완전한 형태이며, createdAt 컬럼이 없어 저장(삽입) 순서로 정렬됩니다.
   * @param user
   * @param groupId
   * @param paginationDto
   */
  @Get(':groupId/items')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponsePagination(CollectionResponse)
  @ApiNotFoundResponse({ description: '보관함을 찾을 수 없습니다.' })
  async getCollectionItems(
    @CurrentUser() user: User,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationType<CollectionResponse>> {
    const { total, items } = await this.collectionsService.findGroupItems(
      user,
      groupId,
      paginationDto,
    );
    return {
      items: items.map((item) => CollectionResponse.fromCollection(item)),
      metadata: { ...paginationDto, total },
    };
  }

  /**
   * 보관함(그룹) 이름 수정
   * @remarks
   * 보관함 이름을 변경합니다. 본인 소유가 아니거나 존재하지 않으면 404,
   * 변경할 이름이 이미 존재하면 409 를 반환합니다.
   * @param user
   * @param groupId
   * @param dto
   */
  @Patch(':groupId')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(CollectionGroupResponse)
  @ApiNotFoundResponse({ description: '보관함을 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '이미 존재하는 보관함 이름입니다.' })
  async updateCollectionGroup(
    @CurrentUser() user: User,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: UpdateCollectionGroupDto,
  ): Promise<CollectionGroupResponse> {
    const group = await this.collectionsService.updateGroup(user, groupId, dto);
    return CollectionGroupResponse.fromGroup(group);
  }

  /**
   * 보관함(그룹) 삭제
   * @remarks
   * 보관함을 삭제합니다. 본인 소유가 아니거나 존재하지 않으면 404 를 반환합니다.
   *
   * ★ 보관함에 담긴 스크랩은 함께 삭제됩니다(스크랩된 프로필 카드 원본은 삭제되지 않습니다).
   * @param user
   * @param groupId
   */
  @Delete(':groupId')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiNotFoundResponse({ description: '보관함을 찾을 수 없습니다.' })
  async deleteCollectionGroup(
    @CurrentUser() user: User,
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<void> {
    await this.collectionsService.deleteGroup(user, groupId);
  }
}
