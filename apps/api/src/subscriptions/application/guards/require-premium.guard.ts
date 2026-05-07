import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RequestWithUser } from 'src/auth/core/types/request-with-user';
import { SCHOOL_REPOSITORY } from 'src/schools/core/ports/tokens';
import type { SchoolRepository } from 'src/schools/core/ports/school.repository';

import { REQUIRE_PREMIUM_KEY } from '../decorators/require-premium.decorator';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class RequirePremiumGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirePremium = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_PREMIUM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirePremium) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role !== 'private') {
      throw new ForbiddenException(
        'Only school accounts can access premium features.',
      );
    }

    const school = await this.schoolRepository.findByOwner(user.sub);

    if (!school) {
      throw new ForbiddenException(
        'You need to create your school before using premium features.',
      );
    }

    const activePlans = await this.subscriptionsService.getSchoolActivePlans(
      school.id,
    );

    const hasPremium = activePlans.some(p => p.plan.name === 'PREMIUM_SUBSCRIPTION');

    if (!hasPremium) {
      throw new ForbiddenException(
        'This feature requires an active Premium subscription.',
      );
    }

    return true;
  }
}
