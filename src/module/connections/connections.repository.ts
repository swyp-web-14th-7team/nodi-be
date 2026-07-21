import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { CardConnection, CardConnectionRequest, Prisma } from '@/prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import { displayProfileCardIncludeOptions } from '@/module/profile-cards/profile-cards.type';
import {
  ConnectionRequestWithParties,
  ReceivedConnectionRequest,
  receivedRequestIncludeOptions,
  requestPartiesIncludeOptions,
  SentConnectionRequest,
  sentRequestIncludeOptions,
} from '@/module/connections/connection-request.type';
import { ConnectionRequestStatus } from '@/module/connections/type/connection-request-status.enum';
import { toCardSnapshot } from '@/module/connections/connections.type';

// 카드 소유자·활성 여부 확인용 최소 조회 결과
export type CardOwnership = { id: string; userId: string; isActive: boolean };

@Injectable()
export class ConnectionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ------------------- 카드 확인 -------------------

  /** 카드 존재/소유자/활성 여부 확인용 최소 조회 */
  async findCardOwnership(cardId: string): Promise<CardOwnership | null> {
    return this.prismaService.userProfileCard.findUnique({
      where: { id: cardId },
      select: { id: true, userId: true, isActive: true },
    });
  }

  // ------------------- 연결 요청 -------------------

  async findRequestByCardPair(
    requesterCardId: string,
    receiverCardId: string,
  ): Promise<CardConnectionRequest | null> {
    return this.prismaService.cardConnectionRequest.findUnique({
      where: {
        requesterCardId_receiverCardId: { requesterCardId, receiverCardId },
      },
    });
  }

  async createRequest(data: {
    requesterCardId: string;
    receiverCardId: string;
    message?: string;
  }): Promise<SentConnectionRequest> {
    return this.prismaService.cardConnectionRequest.create({
      data,
      include: sentRequestIncludeOptions,
    });
  }

  /** 거절/취소된 요청을 다시 PENDING 으로 되살린다. */
  async reviveRequest(
    id: string,
    message: string | null,
  ): Promise<SentConnectionRequest> {
    return this.prismaService.cardConnectionRequest.update({
      where: { id },
      data: {
        status: ConnectionRequestStatus.PENDING,
        message,
        respondedAt: null,
      },
      include: sentRequestIncludeOptions,
    });
  }

  /** 권한 확인용: 양쪽 카드 소유자 포함 단건 조회 */
  async findRequestWithParties(
    id: string,
  ): Promise<ConnectionRequestWithParties | null> {
    return this.prismaService.cardConnectionRequest.findUnique({
      where: { id },
      include: requestPartiesIncludeOptions,
    });
  }

  /** 특정 카드가 받은 PENDING 요청함 (상대 카드 전체 포함) */
  async findManyReceived(
    receiverCardId: string,
    { skip, limit, order }: PaginationDto,
  ): Promise<PaginationResult<ReceivedConnectionRequest>> {
    const where: Prisma.CardConnectionRequestWhereInput = {
      receiverCardId,
      status: ConnectionRequestStatus.PENDING,
    };
    const [total, items] = await Promise.all([
      this.prismaService.cardConnectionRequest.count({ where }),
      this.prismaService.cardConnectionRequest.findMany({
        where,
        include: receivedRequestIncludeOptions,
        skip,
        take: limit,
        orderBy: { createdAt: order },
      }),
    ]);
    return { total, items };
  }

  /** 특정 카드가 보낸 요청 목록 (상태 무관, 상대 카드 전체 포함) */
  async findManySent(
    requesterCardId: string,
    { skip, limit, order }: PaginationDto,
  ): Promise<PaginationResult<SentConnectionRequest>> {
    const where: Prisma.CardConnectionRequestWhereInput = { requesterCardId };
    const [total, items] = await Promise.all([
      this.prismaService.cardConnectionRequest.count({ where }),
      this.prismaService.cardConnectionRequest.findMany({
        where,
        include: sentRequestIncludeOptions,
        skip,
        take: limit,
        orderBy: { createdAt: order },
      }),
    ]);
    return { total, items };
  }

  async updateStatus(
    id: string,
    status: ConnectionRequestStatus,
  ): Promise<CardConnectionRequest> {
    return this.prismaService.cardConnectionRequest.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });
  }

  /**
   * 요청 수락: 한 트랜잭션에서
   *  1) 양쪽 카드를 전체 include 로 조회해 스냅샷을 뜨고
   *  2) 요청 상태를 ACCEPTED 로 변경하고
   *  3) CardConnection(보관)을 생성한다.
   */
  async acceptRequest(
    request: Pick<
      CardConnectionRequest,
      'id' | 'requesterCardId' | 'receiverCardId' | 'message'
    >,
  ): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const [requesterCard, receiverCard] = await Promise.all([
        tx.userProfileCard.findUniqueOrThrow({
          where: { id: request.requesterCardId },
          include: displayProfileCardIncludeOptions,
        }),
        tx.userProfileCard.findUniqueOrThrow({
          where: { id: request.receiverCardId },
          include: displayProfileCardIncludeOptions,
        }),
      ]);

      await tx.cardConnectionRequest.update({
        where: { id: request.id },
        data: {
          status: ConnectionRequestStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      await tx.cardConnection.create({
        data: {
          requesterUserId: requesterCard.userId,
          receiverUserId: receiverCard.userId,
          requesterCardId: requesterCard.id,
          receiverCardId: receiverCard.id,
          requesterCardSnapshot: toCardSnapshot(requesterCard),
          receiverCardSnapshot: toCardSnapshot(receiverCard),
          message: request.message,
        },
      });
    });
  }

  // ------------------- 연결(보관) -------------------

  /** 내가 당사자이면서 내 관점에서 제거하지 않은 연결(보관) 목록 */
  async findManyByUser(
    userId: string,
    { skip, limit, order }: PaginationDto,
  ): Promise<PaginationResult<CardConnection>> {
    const where: Prisma.CardConnectionWhereInput = {
      OR: [
        { requesterUserId: userId, requesterRemovedAt: null },
        { receiverUserId: userId, receiverRemovedAt: null },
      ],
    };
    const [total, items] = await Promise.all([
      this.prismaService.cardConnection.count({ where }),
      this.prismaService.cardConnection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { connectedAt: order },
      }),
    ]);
    return { total, items };
  }

  /** 연결(보관) 단건 조회 */
  async findConnectionById(id: string): Promise<CardConnection | null> {
    return this.prismaService.cardConnection.findUnique({ where: { id } });
  }

  /** 내 관점에서 보관함에서 제거 (소프트 삭제) */
  async softRemoveByUser(
    id: string,
    side: 'requester' | 'receiver',
  ): Promise<void> {
    await this.prismaService.cardConnection.update({
      where: { id },
      data:
        side === 'requester'
          ? { requesterRemovedAt: new Date() }
          : { receiverRemovedAt: new Date() },
    });
  }
}
