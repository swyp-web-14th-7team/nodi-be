import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { ConnectionsService } from '@/module/connections/connections.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { PaginationType } from '@/common/type/pagination.type';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ConnectionResponse } from '@/module/connections/type/connection-response.type';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * 내 보관함(성립된 연결) 목록 조회
   * @remarks
   * 연결 요청이 수락되어 성립된 연결(보관)을 페이지네이션으로 조회합니다.
   * 내가 요청자든 수신자든 당사자인 연결이 모두 포함되며,
   * 내 관점에서 제거(소프트 삭제)한 연결은 제외됩니다.
   *
   * **요청 query**
   * - page, limit, sort, order: 페이지네이션 옵션
   *
   * **응답 body**
   * - items: 연결 목록. 각 항목의 card 는 성립 시점의 상대 카드 스냅샷
   * - metadata: 페이지네이션 정보
   */
  @Get()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponsePagination(ConnectionResponse)
  async getMyConnections(
    @CurrentUser() user: User,
    @Query() query: PaginationDto,
  ): Promise<PaginationType<ConnectionResponse>> {
    const { total, items } = await this.connectionsService.getMyConnections(
      user,
      query,
    );
    return {
      items: items.map((item) =>
        ConnectionResponse.fromConnection(item, user.id),
      ),
      metadata: { ...query, total },
    };
  }

  /**
   * 내 보관함의 연결 단건 조회
   * @remarks
   * 성립된 연결(보관) 하나를 조회합니다.
   * 존재하지 않거나 내가 당사자가 아니거나 이미 제거한 연결이면 404 를 반환합니다.
   *
   * **path param**
   * - id: 연결(보관) ID
   *
   * **응답 body**
   * - id: 연결(보관) ID
   * - card: 성립 시점의 상대 카드 스냅샷
   * - message: 연결 요청 시 첨부한 메시지
   * - connectedAt: 연결 성립 시각
   */
  @Get(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ConnectionResponse)
  @ApiNotFoundResponse({ description: '연결을 찾을 수 없습니다.' })
  async getConnection(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ConnectionResponse> {
    const connection = await this.connectionsService.getConnection(user, id);
    return ConnectionResponse.fromConnection(connection, user.id);
  }

  /**
   * 보관함에서 연결 제거
   * @remarks
   * 성립된 연결을 내 보관함에서 제거합니다(내 관점 소프트 삭제).
   * 상대방 보관함에는 그대로 남습니다.
   * 존재하지 않거나 내가 당사자가 아니거나 이미 제거한 연결이면 404 를 반환합니다.
   *
   * **path param**
   * - id: 연결(보관) ID
   *
   * **응답 body**
   * - 없음
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiNotFoundResponse({ description: '연결을 찾을 수 없습니다.' })
  async removeConnection(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.connectionsService.removeConnection(user, id);
  }
}
