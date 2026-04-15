import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { SchoolsModule } from 'src/schools/schools.module';

import { SubscriptionsController } from './application/subscriptions.controller';
import { RequirePremiumGuard } from './application/guards/require-premium.guard';
import { SubscriptionsService } from './application/subscriptions.service';

@Module({
  imports: [DbModule, AuthModule, SchoolsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, RequirePremiumGuard],
  exports: [SubscriptionsService, RequirePremiumGuard],
})
export class SubscriptionsModule {}
