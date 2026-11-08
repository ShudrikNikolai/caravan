import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { MAX_AGE } from './consts';
import type { Tokens } from './interfaces/tokens.interface';
import { ChangePasswordDto } from './schemas/change-password.schema';
import { LoginDto } from './schemas/login.schema';
import { RegisterDto } from './schemas/register.schema';
import { ChangePasswordUseCase } from './usecases/change-password.usecase';
import { GetProfileUseCase } from './usecases/get-profile.usecase';
import { GetSessionsUseCase } from './usecases/get-sessions.usecase';
import { LoginUseCase } from './usecases/login.usecase';
import { LogoutUseCase } from './usecases/logout.usecase';
import { RefreshTokensUseCase } from './usecases/refresh-tokens.usecase';
import { RegisterUseCase } from './usecases/register.usecase';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getSessionsUseCase: GetSessionsUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginSchema: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute(
      loginSchema,
      req.ip ?? '',
      req.headers['user-agent'],
    );

    this.setAuthCookies(res, result.tokens);

    return { message: 'ok', user: result.user };
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerSchema: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerUseCase.execute(registerSchema);

    this.setAuthCookies(res, result.tokens);

    return { message: 'ok', user: result.user };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  async refresh(
    @CurrentUser('userId') userId: string,
    @CurrentUser('refreshTokenId') refreshTokenId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.refreshTokensUseCase.execute(
      refreshTokenId,
      userId,
    );

    this.setAuthCookies(res, tokens);

    return { message: 'ok' };
  }

  @Post('logout')
  @ApiBearerAuth()
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUseCase.execute(userId);

    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Patch('password/change')
  @ApiBearerAuth()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.changePasswordUseCase.execute(
      userId,
      dto.username,
      dto.oldpass,
      dto.newpass,
    );

    return { message: 'Password changed successfully' };
  }

  @Get('sessions')
  @ApiBearerAuth()
  async getActiveSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.getSessionsUseCase.execute(userId);

    return { sessions };
  }

  @Get('me')
  @ApiBearerAuth()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.getProfileUseCase.execute(userId);
  }

  private clearAuthCookies(res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  private setAuthCookies(res: Response, tokens: Tokens) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: MAX_AGE(tokens.expiresIn),
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: MAX_AGE(tokens.refreshExpiresIn ?? 1),
    });
  }
}
