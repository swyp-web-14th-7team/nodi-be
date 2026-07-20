import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ConnectionRequestsService } from '@/module/connections/connection-requests.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { PaginationType } from '@/common/type/pagination.type';
import { CreateConnectionRequestDto } from '@/module/connections/dto/create-connection-request.dto';
import { ConnectionRequestListQueryDto } from '@/module/connections/dto/connection-request-list.query.dto';
import { ConnectionRequestResponse } from '@/module/connections/type/connection-request-response.type';

@Controller('connection-requests')
export class ConnectionRequestsController {
  constructor(
    private readonly connectionRequestsService: ConnectionRequestsService,
  ) {}

  /**
   * 연결 요청 보내기
   * @remarks
   * 내 카드(requesterCardId)로 상대 카드(receiverCardId)에 연결을 요청합니다.
   *
   * **요청 body**
   * - requesterCardId: 요청자의 카드 ID
   * - receiverCardId: 요청 대상자의 카드 ID
   * - message: 첨부할 메세지 (optional)
   *
   * **응답 body**
   * - id: 연결 요청 ID
   * - status: 요청 상태 (0 대기 / 1 수락 / 2 거절 / 3 취소)
   * - message: 첨부한 메세지
   * - card: 요청을 받은 상대 카드
   * - createdAt: 요청 생성 시각
   */
  @Post()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ConnectionRequestResponse, { status: 201 })
  @ApiBadRequestResponse({ description: '잘못된 요청 대상입니다.' })
  @ApiForbiddenResponse({ description: '본인 소유의 카드가 아닙니다.' })
  @ApiNotFoundResponse({ description: '카드를 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '이미 진행 중이거나 연결된 요청입니다.' })
  async createRequest(
    @CurrentUser() user: User,
    @Body() dto: CreateConnectionRequestDto,
  ): Promise<ConnectionRequestResponse> {
    const request = await this.connectionRequestsService.createRequest(
      user,
      dto,
    );
    return ConnectionRequestResponse.fromSent(request);
  }

  /**
   * 받은 연결 요청함 조회
   * @remarks
   * 내 카드(cardId)가 받은 대기(PENDING) 상태 요청 목록을 페이지네이션으로 조회합니다.
   *
   * **요청 query**
   * - cardId: 조회 기준이 되는 내 카드 ID
   * - page, limit, sort, order: 페이지네이션 옵션
   *
   * **응답 body**
   * - items: 연결 요청 목록 (각 항목의 card 는 요청을 보낸 상대 카드)
   * - metadata: 페이지네이션 정보
   */
  @Get('received')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponsePagination(ConnectionRequestResponse)
  @ApiNotFoundResponse({ description: '카드를 찾을 수 없습니다.' })
  async getReceived(
    @CurrentUser() user: User,
    @Query() query: ConnectionRequestListQueryDto,
  ): Promise<PaginationType<ConnectionRequestResponse>> {
    const { total, items } = await this.connectionRequestsService.getReceived(
      user,
      query.cardId,
      query,
    );
    return {
      items: items.map((item) => ConnectionRequestResponse.fromReceived(item)),
      metadata: { ...query, total },
    };
  }

  /**
   * 보낸 연결 요청함 조회
   * @remarks
   * 내 카드(cardId)가 보낸 요청 목록을 상태 무관으로 페이지네이션 조회합니다.
   *
   * **요청 query**
   * - cardId: 조회 기준이 되는 내 카드 ID
   * - page, limit, sort, order: 페이지네이션 옵션
   *
   * **응답 body**
   * - items: 연결 요청 목록 (각 항목의 card 는 요청을 받은 상대 카드)
   * - metadata: 페이지네이션 정보
   */
  @Get('sent')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponsePagination(ConnectionRequestResponse)
  @ApiNotFoundResponse({ description: '카드를 찾을 수 없습니다.' })
  async getSent(
    @CurrentUser() user: User,
    @Query() query: ConnectionRequestListQueryDto,
  ): Promise<PaginationType<ConnectionRequestResponse>> {
    const { total, items } = await this.connectionRequestsService.getSent(
      user,
      query.cardId,
      query,
    );
    return {
      items: items.map((item) => ConnectionRequestResponse.fromSent(item)),
      metadata: { ...query, total },
    };
  }

  /**
   * 연결 요청 수락
   * @remarks
   * 받은 요청을 수락하면 양쪽 카드의 스냅샷을 떠 보관(연결)이 생성됩니다.
   *
   * **path param**
   * - id: 연결 요청 ID
   *
   * **응답 body**
   * - 없음
   */
  @Patch(':id/accept')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiForbiddenResponse({
    description: '요청을 받은 카드의 소유자가 아닙니다.',
  })
  @ApiNotFoundResponse({ description: '연결 요청을 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '대기 중인 요청만 처리할 수 있습니다.' })
  async acceptRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.connectionRequestsService.acceptRequest(user, id);
  }

  /**
   * 연결 요청 거절
   * @remarks
   * 받은 요청을 거절합니다.
   *
   * **path param**
   * - id: 연결 요청 ID
   *
   * **응답 body**
   * - 없음
   */
  @Patch(':id/reject')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiForbiddenResponse({
    description: '요청을 받은 카드의 소유자가 아닙니다.',
  })
  @ApiNotFoundResponse({ description: '연결 요청을 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '대기 중인 요청만 처리할 수 있습니다.' })
  async rejectRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.connectionRequestsService.rejectRequest(user, id);
  }

  /**
   * 연결 요청 취소
   * @remarks
   * 내가 보낸 요청을 취소합니다.
   *
   * **path param**
   * - id: 연결 요청 ID
   *
   * **응답 body**
   * - 없음
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiForbiddenResponse({ description: '본인이 보낸 요청이 아닙니다.' })
  @ApiNotFoundResponse({ description: '연결 요청을 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '대기 중인 요청만 취소할 수 있습니다.' })
  async cancelRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.connectionRequestsService.cancelRequest(user, id);
  }
}
