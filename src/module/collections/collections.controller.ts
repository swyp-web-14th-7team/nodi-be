import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CollectionsService } from '@/module/collections/collections.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { CreateCollectionDto } from '@/module/collections/dto/create-collection.dto';
import { UpdateCollectionDto } from '@/module/collections/dto/update-collection.dto';
import { CollectionResponse } from '@/module/collections/type/collection-response.type';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * 카드 스크랩 (보관함에 담기)
   * @remarks
   * 프로필 카드를 지정한 보관함(groupId)에 스크랩합니다.
   * 담을 보관함이 본인 소유가 아니거나 존재하지 않으면 404,
   * 카드가 존재하지 않으면 400, 이미 스크랩한 카드면 409 를 반환합니다.
   *
   * ★ 카드는 유저당 1번만 스크랩할 수 있습니다(보관함이 달라도 중복 불가).
   * @param user
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(CollectionResponse, { status: 201 })
  @ApiNotFoundResponse({ description: '보관함을 찾을 수 없습니다.' })
  @ApiBadRequestResponse({ description: '존재하지 않는 프로필 카드입니다.' })
  @ApiConflictResponse({ description: '이미 스크랩한 카드입니다.' })
  async createCollection(
    @CurrentUser() user: User,
    @Body() dto: CreateCollectionDto,
  ): Promise<CollectionResponse> {
    const collection = await this.collectionsService.createCollection(
      user,
      dto,
    );
    return CollectionResponse.fromCollection(collection);
  }

  /**
   * 스크랩 보관함 이동
   * @remarks
   * 스크랩을 다른 보관함으로 이동합니다.
   * 스크랩 또는 이동 대상 보관함이 본인 소유가 아니거나 존재하지 않으면 404 를 반환합니다.
   * @param user
   * @param id
   * @param dto
   */
  @Patch(':collectionId')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(CollectionResponse)
  @ApiNotFoundResponse({
    description: '스크랩 또는 보관함을 찾을 수 없습니다.',
  })
  async moveCollection(
    @CurrentUser() user: User,
    @Param('collectionId', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionDto,
  ): Promise<CollectionResponse> {
    const collection = await this.collectionsService.moveCollection(
      user,
      id,
      dto,
    );
    return CollectionResponse.fromCollection(collection);
  }

  /**
   * 스크랩 삭제 (보관함에서 빼기)
   * @remarks
   * 스크랩을 삭제합니다. 본인 소유가 아니거나 존재하지 않으면 404 를 반환합니다.
   * (스크랩된 프로필 카드 원본은 삭제되지 않습니다.)
   * @param user
   * @param id
   */
  @Delete(':collectionId')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiNotFoundResponse({ description: '스크랩을 찾을 수 없습니다.' })
  async deleteCollection(
    @CurrentUser() user: User,
    @Param('collectionId', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.collectionsService.deleteCollection(user, id);
  }
}
