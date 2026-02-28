import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

interface ProfileData {
  name?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  experience?: Array<{ title: string; company: string; startDate?: string; endDate?: string; description?: string }>;
  education?: Array<{ degree: string; school: string; year?: string }>;
  projects?: Array<{ name: string; description: string; url?: string }>;
  links?: Record<string, string>;
}

@Processor('import-unify')
export class ImportUnifyProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportUnifyProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<{ userId: string; providers: string[]; oauthTokens?: Record<string, string> }>,
  ) {
    const { userId, providers, oauthTokens = {} } = job.data;
    this.logger.log(`[import-unify] Job ${job.id} for user ${userId}, providers: ${providers.join(', ')}`);

    const profiles: Record<string, ProfileData> = {};

    for (const provider of providers) {
      const token = oauthTokens[provider];
      if (!token) continue;

      try {
        switch (provider) {
          case 'github': {
            const [userRes, reposRes] = await Promise.all([
              axios.get('https://api.github.com/user', { headers: { Authorization: `token ${token}` } }),
              axios.get('https://api.github.com/user/repos?sort=updated&per_page=10', {
                headers: { Authorization: `token ${token}` },
              }),
            ]);
            profiles.github = {
              name: userRes.data.name,
              bio: userRes.data.bio,
              headline: userRes.data.company ?? 'Software Developer',
              links: { github: userRes.data.html_url },
              projects: reposRes.data.map((r: { name: string; description: string; html_url: string }) => ({
                name: r.name,
                description: r.description ?? '',
                url: r.html_url,
              })),
              skills: ['Git', 'GitHub'],
            };
            break;
          }
          case 'linkedin': {
            // LinkedIn API v2 - basic profile
            const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            profiles.linkedin = {
              name: `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`,
              headline: profileRes.data.localizedHeadline,
              links: { linkedin: `https://linkedin.com/in/${profileRes.data.id}` },
            };
            break;
          }
          default:
            this.logger.debug(`No import handler for provider: ${provider}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to import from ${provider}: ${err}`);
      }
    }

    // Merge profiles
    const merged = this.mergeProfiles(profiles);

    // Notify user
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'import_completed',
        title: `Data imported from ${providers.join(', ')}`,
        payload: { providers, profileSummary: { skills: merged.skills?.length ?? 0, projects: merged.projects?.length ?? 0 } },
      },
    });

    this.logger.log(`[import-unify] Completed for user ${userId}`);
    return { userId, providers, merged, completedAt: new Date().toISOString() };
  }

  private mergeProfiles(profiles: Record<string, ProfileData>): ProfileData {
    const merged: ProfileData = { skills: [], experience: [], education: [], projects: [], links: {} };

    for (const profile of Object.values(profiles)) {
      if (profile.name && !merged.name) merged.name = profile.name;
      if (profile.headline && !merged.headline) merged.headline = profile.headline;
      if (profile.bio && !merged.bio) merged.bio = profile.bio;
      if (profile.skills) merged.skills = [...new Set([...(merged.skills ?? []), ...profile.skills])];
      if (profile.experience) merged.experience = [...(merged.experience ?? []), ...profile.experience];
      if (profile.education) merged.education = [...(merged.education ?? []), ...profile.education];
      if (profile.projects) merged.projects = [...(merged.projects ?? []), ...profile.projects];
      if (profile.links) merged.links = { ...(merged.links ?? {}), ...profile.links };
    }

    return merged;
  }
}

