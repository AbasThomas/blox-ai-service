import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScannerService {
  constructor(private readonly prisma: PrismaService) {}

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  private extractKeyPhrases(text: string): string[] {
    const words = this.tokenize(text);
    const freq = new Map<string, number>();
    words.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1));
    return [...freq.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word]) => word);
  }

  async scan(userId: string, assetId: string, jobDescription: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const contentStr = JSON.stringify(asset.content).toLowerCase();
    const jobKeywords = this.extractKeyPhrases(jobDescription);
    const contentTokens = new Set(this.tokenize(contentStr));

    const presentKeywords = jobKeywords.filter((kw) => contentTokens.has(kw));
    const missingKeywords = jobKeywords.filter((kw) => !contentTokens.has(kw));

    const matchScore = Math.round((presentKeywords.length / Math.max(jobKeywords.length, 1)) * 100);

    const suggestions: string[] = [];
    if (matchScore < 50) suggestions.push('Add more relevant keywords from the job description');
    if (missingKeywords.length > 5) suggestions.push(`Include these missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    if (matchScore >= 80) suggestions.push('Great match! Consider tailoring your summary for the specific role.');

    return {
      assetId,
      matchScore,
      presentKeywords: presentKeywords.slice(0, 15),
      missingKeywords: missingKeywords.slice(0, 15),
      suggestions,
      totalJobKeywords: jobKeywords.length,
    };
  }

  async duplicate(userId: string, assetId: string, jobDescription: string) {
    return this.scan(userId, assetId, jobDescription);
  }

  async atsScore(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const content = asset.content as Record<string, unknown>;
    const sections = (content.sections as unknown[]) ?? [];
    const contentStr = JSON.stringify(content).toLowerCase();

    const checks = [
      { name: 'Has contact info', passed: contentStr.includes('email') || contentStr.includes('phone'), score: 15 },
      { name: 'Has summary/objective', passed: contentStr.includes('summary') || contentStr.includes('objective'), score: 15 },
      { name: 'Has work experience', passed: contentStr.includes('experience') || contentStr.includes('work'), score: 20 },
      { name: 'Has education section', passed: contentStr.includes('education') || contentStr.includes('degree'), score: 15 },
      { name: 'Has skills section', passed: contentStr.includes('skill'), score: 15 },
      { name: 'Uses action verbs', passed: /\b(led|built|managed|created|improved|developed|designed)\b/.test(contentStr), score: 10 },
      { name: 'No images in content (ATS-safe)', passed: !contentStr.includes('image'), score: 10 },
    ];

    const score = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.score, 0);
    const failing = checks.filter((c) => !c.passed).map((c) => c.name);

    return {
      assetId,
      atsScore: score,
      checks,
      improvements: failing.map((name) => `Fix: ${name}`),
    };
  }

  async critique(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const contentStr = JSON.stringify(asset.content);
    const length = contentStr.length;

    const readability = Math.min(100, Math.round(50 + (length / 500)));
    const ats = Math.min(100, Math.round(60 + (length / 800)));
    const seo = Math.min(100, Math.round(55 + (length / 600)));
    const overall = Math.round((readability + ats + seo) / 3);

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { healthScore: overall },
    });

    return {
      assetId,
      overallScore: overall,
      readability,
      ats,
      seo,
      suggestions: [
        overall < 70 && 'Add more detailed content to each section',
        readability < 70 && 'Use shorter sentences and clearer language',
        ats < 70 && 'Ensure section headings match standard ATS expectations',
        seo < 70 && 'Add targeted keywords in your summary and skills sections',
      ].filter(Boolean),
    };
  }
}

