import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ProviderCategory =
  | 'professional'
  | 'developer'
  | 'freelance'
  | 'creative'
  | 'education'
  | 'productivity';

interface ProviderDefinition {
  id: string;
  name: string;
  category: ProviderCategory;
  mode: 'oauth' | 'token' | 'manual';
  authUrl: string | null;
  scopes: string[];
  priority: 'primary' | 'secondary' | 'optional';
  oauthEnvKeys?: string[];
}

const OAUTH_BASE = '/v1/auth/oauth';

const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'professional',
    mode: 'oauth',
    authUrl: `${OAUTH_BASE}/linkedin`,
    scopes: ['r_liteprofile', 'r_emailaddress'],
    priority: 'primary',
    oauthEnvKeys: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'developer',
    mode: 'oauth',
    authUrl: `${OAUTH_BASE}/github`,
    scopes: ['read:user', 'user:email', 'repo'],
    priority: 'secondary',
    oauthEnvKeys: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
  },
  {
    id: 'upwork',
    name: 'Upwork',
    category: 'freelance',
    mode: 'oauth',
    authUrl: `${OAUTH_BASE}/upwork`,
    scopes: ['freelancer.profile.read', 'graphql'],
    priority: 'secondary',
    oauthEnvKeys: ['UPWORK_CLIENT_ID', 'UPWORK_CLIENT_SECRET'],
  },
  {
    id: 'fiverr',
    name: 'Fiverr',
    category: 'freelance',
    mode: 'manual',
    authUrl: null,
    scopes: [],
    priority: 'optional',
  },
  {
    id: 'behance',
    name: 'Behance',
    category: 'creative',
    mode: 'manual',
    authUrl: null,
    scopes: [],
    priority: 'optional',
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    category: 'creative',
    mode: 'manual',
    authUrl: null,
    scopes: [],
    priority: 'optional',
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'creative',
    mode: 'oauth',
    authUrl: `${OAUTH_BASE}/figma`,
    scopes: ['file_read'],
    priority: 'optional',
    oauthEnvKeys: ['FIGMA_CLIENT_ID', 'FIGMA_CLIENT_SECRET'],
  },
  {
    id: 'coursera',
    name: 'Coursera',
    category: 'education',
    mode: 'manual',
    authUrl: null,
    scopes: [],
    priority: 'optional',
  },
];

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  getProviderCatalog() {
    return PROVIDERS;
  }

  async listWithStatus(userId: string) {
    const connections = await this.prisma.oAuthConnection.findMany({
      where: { userId },
      select: {
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const index = new Map(connections.map((item) => [item.provider, item]));

    return PROVIDERS.map((provider) => {
      const connection = index.get(provider.id);
      return {
        ...provider,
        connected: !!connection,
        connectedAt: connection?.createdAt ?? null,
        updatedAt: connection?.updatedAt ?? null,
      };
    });
  }

  async connect(userId: string, provider: string) {
    const providerDef = PROVIDERS.find((item) => item.id === provider);
    if (!providerDef) {
      throw new NotFoundException('Provider not supported');
    }

    const existing = await this.prisma.oAuthConnection.findFirst({
      where: { userId, provider: providerDef.id },
      select: { id: true, createdAt: true },
    });

    const oauthConfigured = this.hasOauthConfig(providerDef);
    const shouldUseOAuth = providerDef.mode === 'oauth' && oauthConfigured;

    if (!existing && !shouldUseOAuth) {
      await this.prisma.oAuthConnection.create({
        data: {
          userId,
          provider: providerDef.id,
          providerUid: `${userId}:${providerDef.id}:fallback`,
          accessToken: null,
          refreshToken: null,
        },
      });
    }

    return {
      provider: providerDef.id,
      mode: providerDef.mode,
      authUrl: shouldUseOAuth ? providerDef.authUrl : null,
      scopes: providerDef.scopes,
      connected: existing ? true : !shouldUseOAuth,
      fallbackMode: !shouldUseOAuth,
      message: shouldUseOAuth
        ? 'Continue with OAuth to import live data.'
        : 'Using fallback/manual import until OAuth app credentials are configured.',
      privacyNotice: 'We only read public/profile data and never post or modify your accounts.',
    };
  }

  async disconnect(userId: string, provider: string) {
    const providerDef = PROVIDERS.find((item) => item.id === provider);
    if (!providerDef) {
      throw new NotFoundException('Provider not supported');
    }

    await this.prisma.oAuthConnection.deleteMany({
      where: { userId, provider },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'OAUTH_DISCONNECT',
        entityType: 'OAuthConnection',
        metadata: { provider },
      },
    });

    return { provider, connected: false };
  }

  private hasOauthConfig(provider: ProviderDefinition) {
    const keys = provider.oauthEnvKeys ?? [];
    if (keys.length === 0) return true;
    return keys.every((key) => !!process.env[key]);
  }
}
