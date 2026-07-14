import { UsersModule } from '@/module/users/users.module';
import { Module } from '@nestjs/common';
import { AffiliationStatusesController } from '@/module/affiliation-statuses/affiliation-statuses.controller';
import { AffiliationStatusesService } from '@/module/affiliation-statuses/affiliation-statuses.service';
import { AffiliationStatusesRepository } from '@/module/affiliation-statuses/affiliation-statuses.repository';

@Module({
  imports: [UsersModule],
  controllers: [AffiliationStatusesController],
  providers: [AffiliationStatusesService, AffiliationStatusesRepository],
})
export class AffiliationStatusesModule {}
