import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, Public } from './decorators';
import type { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guards';
import { AuthService } from './services/auth.service';
import type { StrictRegisterDto } from './dto/register.dto';
import { Tokens } from './interfaces/tokens.interface';
// TODO validate zod
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, req.session);

    // Устанавливаем cookies
    this.setAuthCookies(res, result.tokens);

    return { message: 'ok', user: result.user };
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: StrictRegisterDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    this.setAuthCookies(res, result.tokens);

    return { message: 'ok', user: result.user };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.refreshTokens(
      req.user.refreshTokenId,
      req.user.userId,
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
    await this.authService.logout(userId);

    // Очищаем cookies
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Post('password/change')
  @ApiBearerAuth()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.authService.changePassword(userId, currentPassword, newPassword);
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
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    // @ts-ignore
    if (res.req.session) {
      // @ts-ignore
      res.req.session.destroy();
    }
  }

  private setAuthCookies(res: Response, tokens: Tokens) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: (tokens.refreshExpiresIn ?? 1) * 1000, // TODO
    });
  }
}
