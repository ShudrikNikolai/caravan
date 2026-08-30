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
    const result = await this.authService.login(loginSchema, req.session);

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
    @Body('username') username: string,
    @Body('currentPassword') oldpass: string,
    @Body('newPassword') newpass: string,
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
    const req = res.req as Request;
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          res.clearCookie('access_token');
          res.clearCookie('refresh_token');
        }
      });
    }
  }

  private setAuthCookies(res: Response, tokens: Tokens) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MAX_AGE(tokens.expiresIn),
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MAX_AGE(tokens.refreshExpiresIn ?? 1),
    });
  }
}
