import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import type express from 'express';

import { LoginUseCase } from 'src/auth/core/use-cases/login.use-cae';
import { LogoutUseCase } from 'src/auth/core/use-cases/logOut.use-case';
import { RefreshUseCase } from 'src/auth/core/use-cases/refresh.use-case';
import { RegisterUserUseCase } from 'src/auth/core/use-cases/register.use-case';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,

    @Inject(RegisterUserUseCase)
    private readonly registerUseCase: RegisterUserUseCase,

    @Inject(RefreshUseCase)
    private readonly refreshUseCase: RefreshUseCase,

    @Inject(LogoutUseCase)
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  // 🍪 Centralizamos cookies aquí
  private setAuthCookies(
    res: express.Response,
    accessToken: string,
    refreshToken: string,
    req: express.Request,
  ): void {
    const origin = req.get('origin') || '';
    const isLocalhost = origin.includes('localhost');

    const cookieOptions = {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: isLocalhost ? ('lax' as const) : ('none' as const),
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(
      dto.name,
      dto.email,
      dto.password,
      dto.role,
    );
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken } = await this.loginUseCase.execute(
      dto.email,
      dto.password,
    );

    this.setAuthCookies(res, accessToken, refreshToken, req);

    return { message: 'Login successful' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const tokens = await this.refreshUseCase.execute(refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken, req);

    return { success: true };
  }

  @Post('logout')
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token;

    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }

    // 🍪 limpiar cookies con los mismos atributos que se crearon
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    return { message: 'Logged out successfully' };
  }
}
