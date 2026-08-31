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
import type { Response, Request } from 'express';
import { CurrentUser, Public } from './decorators';
import type { TLoginSchema } from './schemas/login.schema';
import { RefreshTokenGuard } from './guards';
import { AuthService } from './services/auth.service';
import type { TStrictRegisterSchema } from './schemas/register.schema';
import { Tokens } from './interfaces/tokens.interface';
import { MAX_AGE } from './consts';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginSchema: TLoginSchema,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginSchema,
      req.ip ?? '',
      req.headers['user-agent'],
    );

    // Устанавливаем cookies
    this.setAuthCookies(res, result.tokens);

    return { message: 'ok', user: result.user };
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerSchema: TStrictRegisterSchema,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerSchema);

    this.setAuthCookies(res, result.tokens);

    return { message: 'ok', user: result.user };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  async refresh(
    @CurrentUser('id') userId: string,
    @Body('refreshTokenId') refreshTokenId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(refreshTokenId, userId);
    this.setAuthCookies(res, tokens);
    return { message: 'ok' };
  }

  @Post('logout')
  @ApiBearerAuth()
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);

    // Очищаем cookies
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Patch('password/change')
  @ApiBearerAuth()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('username') username: string,
    @Body('oldpass') oldpass: string,
    @Body('newpass') newpass: string,
  ) {
    await this.authService.changePassword(userId, username, oldpass, newpass);
    return { message: 'Password changed successfully' };
  }

  @Get('sessions')
  @ApiBearerAuth()
  async getActiveSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.authService.getActiveSessions(userId);
    return { sessions };
  }

  @Get('me')
  @ApiBearerAuth()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getUserProfile(userId);
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
