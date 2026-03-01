import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

interface ProviderConfig {
  authorizationUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  linkedin: {
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    scopes: ['r_liteprofile', 'r_emailaddress'],
  },
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    scopes: ['read:user', 'user:email'],
  },
  figma: {
    authorizationUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://api.figma.com/v1/oauth/token',
    clientIdEnv: 'FIGMA_CLIENT_ID',
    clientSecretEnv: 'FIGMA_CLIENT_SECRET',
    scopes: ['file_read'],
  },
  upwork: {
    authorizationUrl: 'https://www.upwork.com/ab/account-security/oauth2/authorize',
    tokenUrl: 'https://www.upwork.com/api/v3/oauth2/token',
    clientIdEnv: 'UPWORK_CLIENT_ID',
    clientSecretEnv: 'UPWORK_CLIENT_SECRET',
    scopes: ['freelancer.profile.read'],
  },
};

@Injectable()
export class OAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /** Verify the user's access JWT and return its payload */
  verifyAccessToken(token: string): { sub: string } {
    try {
      return this.jwtService.verify<{ sub: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /** Build the provider's OAuth authorization URL and embed userId in signed state */
  buildAuthorizationUrl(provider: string, userId: string): string {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) throw new BadRequestException(`Unsupported provider: ${provider}`);

    const clientId = process.env[config.clientIdEnv];
    if (!clientId) throw new BadRequestException(`OAuth not configured for ${provider}`);

    const state = this.jwtService.sign({ userId, provider }, { expiresIn: '10m' });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.callbackUrl(provider),
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /** Exchange the authorization code for tokens, persist connection, return frontend redirect URL */
  async handleCallback(provider: string, code: string, state: string): Promise<string> {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) throw new BadRequestException(`Unsupported provider: ${provider}`);

    let statePayload: { userId: string; provider: string };
    try {
      statePayload = this.jwtService.verify<{ userId: string; provider: string }>(state);
    } catch {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    if (statePayload.provider !== provider) {
      throw new BadRequestException('Provider mismatch in OAuth state');
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    if (!clientId || !clientSecret) {
      throw new BadRequestException(`OAuth not configured for ${provider}`);
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.callbackUrl(provider),
      client_id: clientId,
      client_secret: clientSecret,
    });

    const { data } = await axios.post<Record<string, string>>(
      config.tokenUrl,
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } },
    );

    const { userId } = statePayload;
    const providerUid = `${userId}:${provider}:oauth`;

    await this.prisma.oAuthConnection.upsert({
      where: { provider_providerUid: { provider, providerUid } },
      create: {
        userId,
        provider,
        providerUid,
        accessToken: data['access_token'] ?? null,
        refreshToken: data['refresh_token'] ?? null,
      },
      update: {
        accessToken: data['access_token'] ?? null,
        refreshToken: data['refresh_token'] ?? null,
      },
    });

    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:4200';
    return `${appUrl}/settings?tab=Integrations&connected=${provider}`;
  }

  private callbackUrl(provider: string): string {
    const apiBase =
      process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? '3333'}`;
    return `${apiBase}/v1/auth/oauth/${provider}/callback`;
  }
}
