import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, type Notification } from '@/prisma/client';
import { FindAllNotificationsDto } from '@/module/notifications/dto/find-all-notifications.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: Prisma.NotificationUncheckedCreateInput,
  ): Promise<Notification> {
    return this.prismaService.notification.create({ data: dto });
  }

  async findAll(
    userId: string,
    { sort, isRead, order, skip, limit }: FindAllNotificationsDto,
  ): Promise<PaginationResult<Notification>> {
    const whereOptions: Prisma.NotificationWhereInput = {
      userId,
      ...(isRead !== undefined && { readAt: isRead ? { not: null } : null }),
    };
    const [items, total] = await Promise.all([
      this.prismaService.notification.findMany({
        where: whereOptions,
        take: limit,
        skip,
        orderBy: { [sort]: order },
      }),
      this.prismaService.notification.count({ where: whereOptions }),
    ]);
    return { items, total };
  }

  async findOneById(id: string): Promise<Notification | null> {
    return this.prismaService.notification.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.NotificationUncheckedUpdateInput,
  ): Promise<Notification> {
    return this.prismaService.notification.update({
      where: { id },
      data,
    });
  }
}
