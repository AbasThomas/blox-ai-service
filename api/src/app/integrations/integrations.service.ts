import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ALL_PROVIDERS = [
  { id: 'linkedin', name: 'LinkedIn', category: 'professional', authUrl: '/v1/auth/oauth/linkedin' },
  { id: 'github', name: 'GitHub', category: 'developer', authUrl: '/v1/auth/oauth/github' },
  { id: 'google', name: 'Google', category: 'productivity', authUrl: '/v1/auth/oauth/google' },
  { id: 'upwork', name: 'Upwork', category: 'freelance', authUrl: null },
  { id: 'behance', name: 'Behance', category: 'creative', authUrl: null },
  { id: 'dribbble', name: 'Dribbble', category: 'creative', authUrl: null },
  { id: 'notion', name: 'Notion', category: 'productivity', authUrl: null },
  { id: 'slack', name: 'Slack', category: 'productivity', authUrl: null },
  { id: 'trello', name: 'Trello', category: 'productivity', authUrl: null },
  { id: 'asana', name: 'Asana', category: 'productivity', authUrl: null },
  { id: 'gitlab', name: 'GitLab', category: 'developer', authUrl: null },
  { id: 'medium', name: 'Medium', category: 'content', authUrl: null },
  { id: 'hashnode', name: 'Hashnode', category: 'content', authUrl: null },
  { id: 'devto', name: 'Dev.to', category: 'content', authUrl: null },
  { id: 'x', name: 'X (Twitter)', category: 'social', authUrl: null },
  { id: 'instagram', name: 'Instagram', category: 'social', authUrl: null },
  { id: 'youtube', name: 'YouTube', category: 'content', authUrl: null },
  { id: 'fiverr', name: 'Fiverr', category: 'freelance', authUrl: null },
  { id: 'toptal', name: 'Toptal', category: 'freelance', authUrl: null },
  { id: 'stackoverflow', name: 'Stack Overflow', category: 'developer', authUrl: null },
  { id: 'kaggle', name: 'Kaggle', category: 'data', authUrl: null },
  { id: 'researchgate', name: 'ResearchGate', category: 'academic', authUrl: null },
  { id: 'orcid', name: 'ORCID', category: 'academic', authUrl: null },
  { id: 'google-workspace', name: 'Google Workspace', category: 'productivity', authUrl: null },
  { id: 'calendly', name: 'Calendly', category: 'scheduling', authUrl: null },
];

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWithStatus(userId: string) {
    const connected = await this.prisma.oAuthConnection.findMany({
      where: { userId },
      select: { provider: true, createdAt: true },
    });
    const connectedSet = new Set(connected.map((c) => c.provider));

    return ALL_PROVIDERS.map((p) => ({
      ...p,
      connected: connectedSet.has(p.id),
      connectedAt: connected.find((c) => c.provider === p.id)?.createdAt ?? null,
    }));
  }

  async disconnect(userId: string, provider: string) {
    await this.prisma.oAuthConnection.deleteMany({ where: { userId, provider } });
    return { provider, connected: false };
  }

  getProviders() {
    return ALL_PROVIDERS;
  }
}


