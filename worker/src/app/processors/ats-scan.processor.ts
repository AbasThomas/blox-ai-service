import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('ats-scan')
export class AtsScanProcessor extends WorkerHost {
  private readonly logger = new Logger(AtsScanProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ assetId: string; userId: string; jobDescription?: string }>) {
    const { assetId, userId, jobDescription } = job.data;
    this.logger.log(`[ats-scan] Job ${job.id} for asset ${assetId}`);

    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new Error('Asset not found');

    const text = JSON.stringify(asset.content).toLowerCase();

    const checks = [
      { key: 'contact_info', label: 'Has contact information', weight: 15, passed: text.includes('email') || text.includes('@') || text.includes('phone') },
      { key: 'summary', label: 'Has professional summary', weight: 15, passed: text.includes('summary') || text.includes('objective') || text.includes('profile') },
      { key: 'experience', label: 'Has work experience', weight: 20, passed: text.includes('experience') || text.includes('work') || text.includes('employment') },
      { key: 'education', label: 'Has education section', weight: 15, passed: text.includes('education') || text.includes('degree') || text.includes('university') },
      { key: 'skills', label: 'Has skills section', weight: 15, passed: text.includes('skill') },
      { key: 'action_verbs', label: 'Uses action verbs', weight: 10, passed: /\b(led|built|managed|created|improved|developed|designed|achieved|delivered|launched)\b/.test(text) },
      { key: 'quantified', label: 'Has quantified achievements', weight: 10, passed: /\d+[%+x]|\$\d+|\d+\s*(users|customers|team|projects)/.test(text) },
    ];

    let score = 0;
    const failing: string[] = [];
    for (const check of checks) {
      if (check.passed) score += check.weight;
      else failing.push(check.label);
    }

    // Keyword match if job description provided
    let keywordMatch: { score: number; missing: string[] } | null = null;
    if (jobDescription) {
      const jobWords = new Set(jobDescription.toLowerCase().match(/\b\w{4,}\b/g) ?? []);
      const contentWords = new Set(text.match(/\b\w{4,}\b/g) ?? []);
      const missing = [...jobWords].filter((w) => !contentWords.has(w)).slice(0, 10);
      const matched = [...jobWords].filter((w) => contentWords.has(w)).length;
      keywordMatch = { score: Math.round((matched / Math.max(jobWords.size, 1)) * 100), missing };
    }

    const result = { assetId, atsScore: score, checks, failing, keywordMatch, scannedAt: new Date().toISOString() };

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { content: { ...(asset.content as object), atsResult: result } },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ats_scan_ready',
        title: `ATS Scan complete — Score: ${score}/100`,
        payload: { assetId, score, failingChecks: failing.length },
      },
    });

    return result;
  }
}
