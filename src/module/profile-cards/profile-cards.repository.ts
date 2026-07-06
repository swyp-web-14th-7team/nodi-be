import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { User, UserProfileCard } from '@/prisma/client';

@Injectable()
export class ProfileCardsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createProfileCard(
    user: User,
    templateId: number,
    isDefault: boolean,
  ): Promise<UserProfileCard> {
    return this.prismaService.userProfileCard.create({
      data: {
        userId: user.id,
        nickname: user.name,
        templateId,
        ...(isDefault && { isDefault }),
      },
    });
  }
}
