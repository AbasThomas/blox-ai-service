import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  resetPassword(@Body('token') token: string, @Body('password') password: string) {
    return this.authService.resetPassword(token, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/setup')
  setupMfa(@CurrentUser() user: User) {
    return this.authService.setupMfa(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  verifyMfa(@CurrentUser() user: User, @Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(user.id, dto);
  }

  // Must be defined before oauth/:provider so the literal segment wins
  @Get('oauth/providers')
  providers() {
    return this.authService.oauthProviders();
  }

  /**
   * OAuth initiation: redirects the browser to the provider's auth page.
   * The user's JWT is passed as ?token= because browser navigation loses
   * the Authorization header.
   */
  @Get('oauth/:provider')
  async oauthInitiate(
    @Param('provider') provider: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:4200';
    try {
      const payload = this.oauthService.verifyAccessToken(token);
      const url = this.oauthService.buildAuthorizationUrl(provider, payload.sub);
      return res.redirect(url);
    } catch {
      return res.redirect(`${appUrl}/settings?tab=Integrations&error=auth_failed`);
    }
  }

  /**
   * OAuth callback: the provider redirects here after the user authorises.
   * Exchanges code for tokens, saves the connection, then redirects to frontend.
   */
  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:4200';

    if (error) {
      return res.redirect(
        `${appUrl}/settings?tab=Integrations&error=${encodeURIComponent(error)}`,
      );
    }

    try {
      const redirectUrl = await this.oauthService.handleCallback(provider, code, state);
      return res.redirect(redirectUrl);
    } catch {
      return res.redirect(`${appUrl}/settings?tab=Integrations&error=oauth_failed`);
    }
  }
}
