import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionsRepository } from '@/module/connections/connections.repository';
import { User } from '@/prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import { CreateConnectionRequestDto } from '@/module/connections/dto/create-connection-request.dto';
import {
  ConnectionRequestWithParties,
  ReceivedConnectionRequest,
  SentConnectionRequest,
} from '@/module/connections/connection-request.type';
import { ConnectionRequestStatus } from '@/module/connections/type/connection-request-status.enum';

@Injectable()
export class ConnectionRequestsService {
  constructor(private readonly connectionsRepository: ConnectionsRepository) {}

  /** 연결 요청 보내기 */
  async createRequest(
    user: User,
    dto: CreateConnectionRequestDto,
  ): Promise<SentConnectionRequest> {
    const { requesterCardId, receiverCardId, message } = dto;

    if (requesterCardId === receiverCardId) {
      throw new BadRequestException('같은 카드에는 연결을 요청할 수 없습니다.');
    }

    // 요청을 보내는 카드는 본인 소유여야 한다.
    const requesterCard =
      await this.connectionsRepository.findCardOwnership(requesterCardId);
    if (!requesterCard) {
      throw new NotFoundException('요청을 보내는 카드를 찾을 수 없습니다.');
    }
    if (requesterCard.userId !== user.id) {
      throw new ForbiddenException('본인 소유의 카드가 아닙니다.');
    }

    // 상대 카드는 존재하고 활성 상태여야 한다.
    const receiverCard =
      await this.connectionsRepository.findCardOwnership(receiverCardId);
    if (!receiverCard || !receiverCard.isActive) {
      throw new NotFoundException(
        '연결을 요청할 상대 카드를 찾을 수 없습니다.',
      );
    }
    if (receiverCard.userId === user.id) {
      throw new BadRequestException(
        '자신의 카드에는 연결을 요청할 수 없습니다.',
      );
    }

    // 같은 카드쌍의 기존 요청 처리
    const existing = await this.connectionsRepository.findRequestByCardPair(
      requesterCardId,
      receiverCardId,
    );
    if (existing) {
      const status = existing.status;
      if (
        status === ConnectionRequestStatus.PENDING ||
        status === ConnectionRequestStatus.ACCEPTED
      ) {
        throw new ConflictException('이미 진행 중이거나 연결된 요청입니다.');
      }
      // 거절/취소된 요청은 되살린다.
      return this.connectionsRepository.reviveRequest(
        existing.id,
        message ?? null,
      );
    }

    return this.connectionsRepository.createRequest({
      requesterCardId,
      receiverCardId,
      message,
    });
  }

  /** 특정 내 카드가 받은 PENDING 요청함 */
  async getReceived(
    user: User,
    cardId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResult<ReceivedConnectionRequest>> {
    await this.assertOwnedCard(user, cardId);
    return this.connectionsRepository.findManyReceived(cardId, pagination);
  }

  /** 특정 내 카드가 보낸 요청 목록 */
  async getSent(
    user: User,
    cardId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResult<SentConnectionRequest>> {
    await this.assertOwnedCard(user, cardId);
    return this.connectionsRepository.findManySent(cardId, pagination);
  }

  /** 요청 수락 (받는 사람만) → 보관(CardConnection) 생성 */
  async acceptRequest(user: User, id: string): Promise<void> {
    const request = await this.getPendingRequestAsReceiver(user, id);
    try {
      await this.connectionsRepository.acceptRequest(request);
    } catch (e) {
      // 동시 수락 등으로 이미 연결이 존재하는 경우
      if (this.isUniqueConflict(e)) {
        throw new ConflictException('이미 연결된 요청입니다.');
      }
      throw e;
    }
  }

  /** 요청 거절 (받는 사람만) */
  async rejectRequest(user: User, id: string): Promise<void> {
    const request = await this.getPendingRequestAsReceiver(user, id);
    await this.connectionsRepository.updateStatus(
      request.id,
      ConnectionRequestStatus.REJECTED,
    );
  }

  /** 요청 취소 (보낸 사람만) */
  async cancelRequest(user: User, id: string): Promise<void> {
    const request = await this.getRequestOrThrow(id);
    if (request.requesterCard.userId !== user.id) {
      throw new ForbiddenException('본인이 보낸 요청이 아닙니다.');
    }
    if (request.status !== ConnectionRequestStatus.PENDING) {
      throw new ConflictException('대기 중인 요청만 취소할 수 있습니다.');
    }
    await this.connectionsRepository.updateStatus(
      request.id,
      ConnectionRequestStatus.CANCELED,
    );
  }

  // ------------------- 내부 헬퍼 -------------------

  private async assertOwnedCard(user: User, cardId: string): Promise<void> {
    const card = await this.connectionsRepository.findCardOwnership(cardId);
    if (!card || card.userId !== user.id) {
      throw new NotFoundException('카드를 찾을 수 없습니다.');
    }
  }

  private async getRequestOrThrow(
    id: string,
  ): Promise<ConnectionRequestWithParties> {
    const request = await this.connectionsRepository.findRequestWithParties(id);
    if (!request) {
      throw new NotFoundException('연결 요청을 찾을 수 없습니다.');
    }
    return request;
  }

  /** 받는 사람 권한 + PENDING 상태를 보장한 요청을 반환 */
  private async getPendingRequestAsReceiver(
    user: User,
    id: string,
  ): Promise<ConnectionRequestWithParties> {
    const request = await this.getRequestOrThrow(id);
    if (request.receiverCard.userId !== user.id) {
      throw new ForbiddenException('요청을 받은 카드의 소유자가 아닙니다.');
    }
    if (request.status !== ConnectionRequestStatus.PENDING) {
      throw new ConflictException('대기 중인 요청만 처리할 수 있습니다.');
    }
    return request;
  }

  private isUniqueConflict(e: unknown): boolean {
    return (
      typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002'
    );
  }
}
