import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionsRepository } from '@/module/connections/connections.repository';
import { CardConnection, User } from '@/prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

// 내가 이 연결의 어느 쪽 당사자인지
type ConnectionSide = 'requester' | 'receiver';

@Injectable()
export class ConnectionsService {
  constructor(private readonly connectionsRepository: ConnectionsRepository) {}

  /** 내 보관함(성립된 연결) 목록 */
  async getMyConnections(
    user: User,
    pagination: PaginationDto,
  ): Promise<PaginationResult<CardConnection>> {
    return this.connectionsRepository.findManyByUser(user.id, pagination);
  }

  /** 내 보관함의 연결 단건 조회 */
  async getConnection(user: User, id: string): Promise<CardConnection> {
    const { connection } = await this.getOwnedActiveConnection(user, id);
    return connection;
  }

  /** 내 관점에서 보관함에서 연결 제거 (소프트 삭제) */
  async removeConnection(user: User, id: string): Promise<void> {
    const { side } = await this.getOwnedActiveConnection(user, id);
    await this.connectionsRepository.softRemoveByUser(id, side);
  }

  /**
   * 내가 당사자이고 내 관점에서 아직 제거하지 않은 연결과, 내 쪽(side) 을 반환한다.
   * 존재하지 않거나 · 내가 당사자가 아니거나 · 이미 제거한 연결이면 404 로 통일한다.
   */
  private async getOwnedActiveConnection(
    user: User,
    id: string,
  ): Promise<{ connection: CardConnection; side: ConnectionSide }> {
    const connection = await this.connectionsRepository.findConnectionById(id);
    const side = this.resolveSide(connection, user.id);
    if (!connection || !side) {
      throw new NotFoundException('연결을 찾을 수 없습니다.');
    }
    const alreadyRemoved =
      side === 'requester'
        ? connection.requesterRemovedAt
        : connection.receiverRemovedAt;
    if (alreadyRemoved) {
      throw new NotFoundException('연결을 찾을 수 없습니다.');
    }
    return { connection, side };
  }

  /** 내가 이 연결의 어느 쪽 당사자인지 판별 (당사자가 아니면 null) */
  private resolveSide(
    connection: CardConnection | null,
    userId: string,
  ): ConnectionSide | null {
    if (!connection) return null;
    if (connection.requesterUserId === userId) return 'requester';
    if (connection.receiverUserId === userId) return 'receiver';
    return null;
  }
}
