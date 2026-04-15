import { Controller, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from 'src/auth/application/decorators/current-user.decorator';
import { Roles } from 'src/auth/application/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/application/guards/auth.guard';
import { RolesGuard } from 'src/auth/application/guards/roles.guard';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Patch('upgrade')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async upgradeToPremium(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.upgradeToPremium(user.sub);
  }
}
