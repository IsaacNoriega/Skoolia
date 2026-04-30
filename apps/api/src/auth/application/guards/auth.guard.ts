/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { JwtPort } from 'src/auth/core/ports/jwt.port';
import { JWT_PORT } from 'src/auth/core/ports/tokens';
import type { RequestWithUser } from 'src/auth/core/types/request-with-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_PORT)
    private readonly jwt: JwtPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwt.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch (e) {
      console.log('[AuthGuard] Invalid token', e);
      throw new UnauthorizedException();
    }
  }
}
