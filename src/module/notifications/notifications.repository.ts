import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, type Notification } from '@/prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: Prisma.NotificationUncheckedCreateInput,
  ): Promise<Notification> {
    return this.prismaService.notification.create({ data: dto });
  }
}
