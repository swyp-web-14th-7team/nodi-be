import { Module } from '@nestjs/common';
import { UsersModule } from '@/module/users/users.module';
import { CardBackgroundImagesController } from '@/module/card-background-images/card-background-images.controller';
import { CardBackgroundImagesService } from '@/module/card-background-images/card-background-images.service';
import { CardBackgroundImagesRepository } from '@/module/card-background-images/card-background-images.repository';

@Module({
  imports: [UsersModule],
  controllers: [CardBackgroundImagesController],
  providers: [CardBackgroundImagesService, CardBackgroundImagesRepository],
})
export class CardBackgroundImagesModule {}
