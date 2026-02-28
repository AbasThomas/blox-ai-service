import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import {
  ImportJobStatusResponse,
  ImportProvider,
  MergedProfileDraft,
  StartOnboardingImportPayload,
} from '@nextjs-blox/shared-types';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_PROVIDERS = new Set<ImportProvider>([
  'linkedin',
  'github',
  'upwork',
  'fiverr',
  'behance',
  'dribbble',
  'figma',
  'coursera',
]);

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('import-unify') private readonly importQueue: Queue,
  ) {}

  async startImport(userId: string, payload: StartOnboardingImportPayload) {
    const providers = (payload.providers ?? []).filter((provider): provider is ImportProvider =>
      ALLOWED_PROVIDERS.has(provider as ImportProvider),
    );
    if (providers.length === 0) {
      throw new BadRequestException('At least one provider is required');
    }

    const session = await this.prisma.onboardingSession.create({
      data: {
        userId,
        persona: payload.persona,
        selectedProviders: providers,
        personalSiteUrl: payload.personalSiteUrl ?? null,
        status: 'in_progress',
      },
    });

    const run = await this.prisma.profileImportRun.create({
      data: {
        userId,
        onboardingSessionId: session.id,
        providers,
        status: 'queued',
        progressPct: 2,
      },
    });

    const job = await this.importQueue.add('import-unify', {
      runId: run.id,
      userId,
      providers,
      persona: payload.persona,
      personalSiteUrl: payload.personalSiteUrl ?? null,
      locationHint: payload.locationHint ?? null,
      manualFallback: payload.manualFallback ?? null,
    });

    await this.prisma.profileImportRun.update({
      where: { id: run.id },
      data: { queueJobId: String(job.id) },
    });

    return {
      runId: run.id,
      queueJobId: String(job.id),
      status: 'queued',
      progressPct: 2,
    } satisfies ImportJobStatusResponse;
  }

  async getImportStatus(userId: string, runId: string): Promise<ImportJobStatusResponse> {
    const run = await this.prisma.profileImportRun.findFirst({
      where: { id: runId, userId },
      select: {
        id: true,
        status: true,
        progressPct: true,
        startedAt: true,
        completedAt: true,
        draftAssetId: true,
        statusMessage: true,
      },
    });

    if (!run) {
      throw new NotFoundException('Import run not found');
    }

    return {
      runId: run.id,
      status: run.status as ImportJobStatusResponse['status'],
      progressPct: run.progressPct,
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
      draftAssetId: run.draftAssetId ?? undefined,
      message: run.statusMessage ?? undefined,
    };
  }

  async getImportPreview(userId: string, runId: string) {
    const run = await this.prisma.profileImportRun.findFirst({
      where: { id: runId, userId },
      select: { id: true },
    });
    if (!run) throw new NotFoundException('Import run not found');

    const preview = await this.prisma.importedProfileSnapshot.findFirst({
      where: { userId, runId, provider: 'merged_preview' },
      orderBy: { createdAt: 'desc' },
      select: {
        normalizedPayload: true,
        rawPayload: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!preview) {
      return {
        runId,
        status: 'pending',
        preview: null,
      };
    }

    return {
      runId,
      status: 'ready',
      preview: preview.normalizedPayload,
      raw: preview.rawPayload,
      createdAt: preview.createdAt.toISOString(),
    };
  }

  async confirmImport(
    userId: string,
    runId: string,
    payload: { overrides?: Partial<MergedProfileDraft>; acceptAutoMerge?: boolean },
  ) {
    const run = await this.prisma.profileImportRun.findFirst({
      where: { id: runId, userId },
      include: {
        importedSnapshots: {
          where: { provider: 'merged_preview' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!run) throw new NotFoundException('Import run not found');

    const preview = run.importedSnapshots[0]?.normalizedPayload as Record<string, unknown> | undefined;
    if (!preview) {
      throw new BadRequestException('Import preview not ready yet');
    }

    const merged = {
      ...preview,
      ...(payload.overrides ?? {}),
      confirmedAt: new Date().toISOString(),
    };

    if (run.draftAssetId) {
      const mergedContent = {
        ...(preview as object),
        mergedProfile: merged,
        generatingStatus: 'completed',
      } as unknown as Prisma.InputJsonValue;

      await this.prisma.asset.update({
        where: { id: run.draftAssetId },
        data: {
          content: mergedContent,
        },
      });
    }

    await this.prisma.profileImportRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        progressPct: 100,
        completedAt: new Date(),
        confirmedPayload: merged as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.onboardingSession.update({
      where: { id: run.onboardingSessionId },
      data: { status: 'completed', completedAt: new Date() },
    });

    return {
      runId: run.id,
      draftAssetId: run.draftAssetId,
      status: 'completed',
    };
  }
}
