import { Injectable } from '@nestjs/common';

@Injectable()
export class IdentityService {
  getPublicIdentity(userId: string) {
    return {
      userId,
      displayName: 'Demo User',
      snapshots: [
        {
          slug: 'demo-user',
          title: 'Demo User Portfolio',
          topSkills: [
            { name: 'TypeScript', score: 0.94 },
            { name: 'NestJS', score: 0.87 },
            { name: 'Next.js', score: 0.9 },
          ],
        },
      ],
    };
  }
}


