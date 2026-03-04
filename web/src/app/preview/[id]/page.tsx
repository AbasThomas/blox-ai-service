'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, publishApi, scannerApi } from '@/lib/api';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface SeoAuditCheck {
  label: string;
  passed: boolean;
  suggestion?: string;
}

interface SeoAudit {
  score: number;
  checks: SeoAuditCheck[];
}

interface SeoForm {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  ogImagePrompt: string;
}

interface AssetPayload {
  id: string;
  title: string;
  type: string;
  slug?: string | null;
  publishedUrl?: string | null;
  content?: Record<string, unknown>;
  seoConfig?: Record<string, unknown>;
}

const VIEW_WIDTHS: Record<ViewMode, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

const EMPTY_SEO_FORM: SeoForm = {
  title: '',
  description: '',
  keywords: '',
  ogImage: '',
  ogImagePrompt: '',
};

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getKeywords(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .join(', ');
  }
  return typeof value === 'string' ? value : '';
}

function normalizeSubdomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function runLocalSeoAudit(form: SeoForm): SeoAudit {
  const checks: SeoAuditCheck[] = [];
  const titleLen = form.title.trim().length;
  const descriptionLen = form.description.trim().length;
  const keywordCount = form.keywords
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean).length;
  const hasOg = form.ogImage.trim().startsWith('http');

  checks.push({
    label: `Title length: ${titleLen} characters (target 50-60)`,
    passed: titleLen >= 50 && titleLen <= 60,
    suggestion:
      titleLen >= 50 && titleLen <= 60
        ? undefined
        : 'Adjust title length to stay between 50 and 60 characters.',
  });
  checks.push({
    label: `Description length: ${descriptionLen} characters (target 150-160)`,
    passed: descriptionLen >= 150 && descriptionLen <= 160,
    suggestion:
      descriptionLen >= 150 && descriptionLen <= 160
        ? undefined
        : 'Adjust description length to stay between 150 and 160 characters.',
  });
  checks.push({
    label: `Keywords: ${keywordCount} entered`,
    passed: keywordCount >= 3,
    suggestion:
      keywordCount >= 3
        ? undefined
        : 'Add at least 3 keywords including role, stack, and location.',
  });
  checks.push({
    label: 'Open Graph image URL is set',
    passed: hasOg,
    suggestion: hasOg ? undefined : 'Generate or add an Open Graph image URL.',
  });

  const passed = checks.filter((item) => item.passed).length;
  return {
    score: Math.round((passed / checks.length) * 100),
    checks,
  };
}

function resolvePublicUrl(
  publishedUrl: string,
  subdomain: string,
  origin: string,
): string {
  if (!publishedUrl && !subdomain) return '';
  if (!publishedUrl) return `${origin}/${subdomain}`;

  try {
    const parsed = new URL(publishedUrl);
    const isLocalHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.localhost');
    if (isLocalHost && subdomain) {
      return `${origin}/${subdomain}`;
    }
    return parsed.toString();
  } catch {
    if (subdomain) return `${origin}/${subdomain}`;
    return publishedUrl;
  }
}

function summarizeAiOutput(content: Record<string, unknown> | undefined) {
  const source = toRecord(content);
  const hero = toRecord(source.hero);
  const about = toRecord(source.about);
  const projects = toRecord(source.projects);
  const projectItems = Array.isArray(projects.items) ? projects.items : [];
  return {
    heroTitle: asString(hero.heading) || 'Untitled',
    heroSubtitle: asString(hero.body),
    about: asString(about.body),
    projectCount: projectItems.length,
  };
}

export default function PreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [asset, setAsset] = useState<AssetPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [subdomain, setSubdomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [seoAudit, setSeoAudit] = useState<SeoAudit | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [seoForm, setSeoForm] = useState<SeoForm>(EMPTY_SEO_FORM);
  const [seoRaw, setSeoRaw] = useState<Record<string, unknown>>({});
  const [seoMsg, setSeoMsg] = useState('');
  const [savingSeo, setSavingSeo] = useState(false);
  const [suggestingSeo, setSuggestingSeo] = useState(false);
  const [generatingOg, setGeneratingOg] = useState(false);

  const hydrateSeoForm = useCallback((raw: unknown) => {
    const record = toRecord(raw);
    setSeoRaw(record);
    setSeoForm({
      title: asString(record.title),
      description: asString(record.description),
      keywords: getKeywords(record.keywords),
      ogImage: asString(record.ogImage),
      ogImagePrompt: asString(record.ogImagePrompt),
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const data = (await assetsApi.getById(params.id)) as AssetPayload;
      setAsset(data);
      const seeded = normalizeSubdomain(
        asString(data.slug) || data.title || '',
      );
      if (seeded) setSubdomain(seeded);
      hydrateSeoForm(data.seoConfig);
    } catch (error) {
      setPublishMsg(
        error instanceof Error ? error.message : 'Could not load preview data.',
      );
    }
  }, [hydrateSeoForm, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return resolvePublicUrl(
      asString(asset?.publishedUrl),
      normalizeSubdomain(subdomain),
      window.location.origin,
    );
  }, [asset?.publishedUrl, subdomain]);

  const aiSummary = useMemo(
    () => summarizeAiOutput(asset?.content),
    [asset?.content],
  );

  const handlePublish = async () => {
    const normalized = normalizeSubdomain(subdomain);
    if (!normalized) {
      setPublishMsg('Enter a valid subdomain.');
      return;
    }
    setPublishing(true);
    setPublishMsg('');
    try {
      const response = (await publishApi.publish({
        assetId: params.id,
        subdomain: normalized,
      })) as { publishedUrl?: string; subdomain?: string; status?: string };
      const nextSubdomain = normalizeSubdomain(
        response.subdomain ?? normalized,
      );
      setSubdomain(nextSubdomain);
      setAsset((previous) =>
        previous
          ? {
              ...previous,
              slug: nextSubdomain,
              publishedUrl: response.publishedUrl ?? previous.publishedUrl,
            }
          : previous,
      );
      await load();
      setPublishMsg(
        response.status === 'scheduled'
          ? 'Publish scheduled.'
          : 'Published successfully.',
      );
    } catch (error) {
      setPublishMsg(
        error instanceof Error ? error.message : 'Publish request failed.',
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this portfolio?')) return;
    setUnpublishing(true);
    setPublishMsg('');
    try {
      await publishApi.unpublish(params.id);
      setAsset((previous) =>
        previous ? { ...previous, publishedUrl: null } : previous,
      );
      await load();
      setPublishMsg('Unpublished.');
    } catch (error) {
      setPublishMsg(
        error instanceof Error ? error.message : 'Unpublish request failed.',
      );
    } finally {
      setUnpublishing(false);
    }
  };

  const handleSeoAudit = async () => {
    const localAudit = runLocalSeoAudit(seoForm);
    setSeoAudit(localAudit);
    setAuditing(true);
    try {
      const serverAudit = (await scannerApi.atsScore({
        assetId: params.id,
      })) as SeoAudit;
      const mergedChecks = [
        ...localAudit.checks,
        ...(serverAudit.checks ?? []).filter(
          (check) =>
            !localAudit.checks.some(
              (localCheck) => localCheck.label === check.label,
            ),
        ),
      ];
      const passedCount = mergedChecks.filter((check) => check.passed).length;
      setSeoAudit({
        score: Math.round(
          (passedCount / Math.max(mergedChecks.length, 1)) * 100,
        ),
        checks: mergedChecks,
      });
    } catch {
      // local audit already shown
    } finally {
      setAuditing(false);
    }
  };

  const handleSuggestSeo = async () => {
    setSuggestingSeo(true);
    setSeoMsg('');
    try {
      const suggestion = (await assetsApi.suggestSeo(params.id)) as {
        title?: string;
        description?: string;
        keywords?: string[];
        ogImagePrompt?: string;
      };
      setSeoForm((previous) => ({
        ...previous,
        title: suggestion.title ?? previous.title,
        description: suggestion.description ?? previous.description,
        keywords: Array.isArray(suggestion.keywords)
          ? suggestion.keywords.join(', ')
          : previous.keywords,
        ogImagePrompt: suggestion.ogImagePrompt ?? previous.ogImagePrompt,
      }));
      setSeoMsg('SEO suggestions generated.');
    } catch (error) {
      setSeoMsg(
        error instanceof Error
          ? error.message
          : 'Could not generate SEO suggestions.',
      );
    } finally {
      setSuggestingSeo(false);
    }
  };

  const handleGenerateOgImage = async () => {
    setGeneratingOg(true);
    setSeoMsg('');
    try {
      const result = (await assetsApi.generateOgImage(params.id)) as {
        ogImage?: string;
      };
      if (result.ogImage) {
        setSeoForm((previous) => ({
          ...previous,
          ogImage: result.ogImage ?? '',
        }));
        setSeoRaw((previous) => ({
          ...previous,
          ogImage: result.ogImage ?? '',
        }));
        setSeoMsg('OG image URL generated.');
      }
    } catch (error) {
      setSeoMsg(
        error instanceof Error ? error.message : 'Could not generate OG image.',
      );
    } finally {
      setGeneratingOg(false);
    }
  };

  const handleSaveSeo = async () => {
    setSavingSeo(true);
    setSeoMsg('');
    try {
      const nextSeo = {
        ...seoRaw,
        title: seoForm.title.trim(),
        description: seoForm.description.trim(),
        keywords: seoForm.keywords
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        ogImage: seoForm.ogImage.trim() || undefined,
        ogImagePrompt: seoForm.ogImagePrompt.trim() || undefined,
      };
      await assetsApi.update(params.id, { seoConfig: nextSeo });
      setSeoRaw(nextSeo);
      setSeoMsg('SEO settings saved.');
    } catch (error) {
      setSeoMsg(
        error instanceof Error ? error.message : 'Could not save SEO settings.',
      );
    } finally {
      setSavingSeo(false);
    }
  };

  const typeLabel = `${asset?.type?.toLowerCase().replace('_', '-') ?? 'portfolios'}s`;

  return (
    <FeaturePage
      title={asset?.title ? `Preview: ${asset.title}` : 'Preview & Publish'}
      description="Preview AI output, publish instantly, and tune SEO settings."
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 overflow-x-hidden">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#0C1118] p-3">
              {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                    viewMode === mode
                      ? 'bg-[#1ECEFA] text-black'
                      : 'border border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {mode}
                </button>
              ))}
              {publicUrl ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                >
                  Open live page
                </a>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <div
                className={`${VIEW_WIDTHS[viewMode]} mx-auto min-h-[460px] overflow-hidden rounded-lg border border-white/10 bg-white shadow-md transition-all`}
              >
                {publicUrl ? (
                  <iframe
                    src={publicUrl}
                    className="h-[560px] w-full border-none"
                    title="Portfolio preview"
                  />
                ) : (
                  <div className="flex h-[460px] flex-col justify-center gap-3 p-6 text-slate-600">
                    <p className="text-lg">{aiSummary.heroTitle}</p>
                    <p className="text-sm text-slate-500">
                      {aiSummary.heroSubtitle}
                    </p>
                    <p className="line-clamp-4 text-sm text-slate-600">
                      {aiSummary.about ||
                        'Publish to view your full public page.'}
                    </p>
                    <p className="text-xs text-slate-500">
                      AI projects detected: {aiSummary.projectCount}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Publish settings
              </h2>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Subdomain
                  </label>
                  <div className="flex items-center overflow-hidden rounded-md border border-white/10 bg-[#0E141D]">
                    <input
                      value={subdomain}
                      onChange={(event) =>
                        setSubdomain(normalizeSubdomain(event.target.value))
                      }
                      placeholder="my-portfolio"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none"
                    />
                    <span className="border-l border-white/10 px-2 py-2 text-xs text-slate-500">
                      .blox.app
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    On localhost, public URL opens as{' '}
                    <span className="font-semibold text-slate-400">
                      /{subdomain || 'your-subdomain'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={publishing}
                  className="w-full rounded-md bg-[#1ECEFA] px-3 py-2 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {publishing ? 'Publishing...' : 'Publish now'}
                </button>
                {asset?.publishedUrl ? (
                  <button
                    type="button"
                    onClick={() => void handleUnpublish()}
                    disabled={unpublishing}
                    className="w-full rounded-md border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    {unpublishing ? 'Unpublishing...' : 'Unpublish'}
                  </button>
                ) : null}
                {publishMsg ? (
                  <p className="text-xs text-slate-300">{publishMsg}</p>
                ) : null}
                {publicUrl ? (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:underline"
                  >
                    {publicUrl}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                SEO metadata
              </h2>
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-slate-400">
                  Title
                  <input
                    value={seoForm.title}
                    onChange={(event) =>
                      setSeoForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Description
                  <textarea
                    rows={3}
                    value={seoForm.description}
                    onChange={(event) =>
                      setSeoForm((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    className="mt-1 w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Keywords
                  <input
                    value={seoForm.keywords}
                    onChange={(event) =>
                      setSeoForm((previous) => ({
                        ...previous,
                        keywords: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  OG image prompt
                  <textarea
                    rows={2}
                    value={seoForm.ogImagePrompt}
                    onChange={(event) =>
                      setSeoForm((previous) => ({
                        ...previous,
                        ogImagePrompt: event.target.value,
                      }))
                    }
                    className="mt-1 w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  OG image URL
                  <input
                    value={seoForm.ogImage}
                    onChange={(event) =>
                      setSeoForm((previous) => ({
                        ...previous,
                        ogImage: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                </label>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleSuggestSeo()}
                  disabled={suggestingSeo}
                  className="w-full rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
                >
                  {suggestingSeo ? 'Generating...' : 'Generate suggestions'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerateOgImage()}
                  disabled={generatingOg}
                  className="w-full rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
                >
                  {generatingOg ? 'Generating...' : 'Generate OG image'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveSeo()}
                  disabled={savingSeo}
                  className="w-full rounded-md bg-[#1ECEFA] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
                >
                  {savingSeo ? 'Saving...' : 'Save SEO'}
                </button>
              </div>
              {seoMsg ? (
                <p className="mt-2 text-xs text-slate-300">{seoMsg}</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                SEO audit
              </h2>
              {seoAudit ? (
                <div className="mt-3 space-y-2">
                  <p className="text-2xl text-slate-100">{seoAudit.score}</p>
                  {seoAudit.checks.map((check) => (
                    <div key={check.label}>
                      <p
                        className={`text-xs ${
                          check.passed ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {check.passed ? 'Pass' : 'Fail'}: {check.label}
                      </p>
                      {!check.passed && check.suggestion ? (
                        <p className="text-[11px] text-slate-400">
                          {check.suggestion}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Run audit to check SEO quality.
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleSeoAudit()}
                disabled={auditing}
                className="mt-3 w-full rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
              >
                {auditing ? 'Auditing...' : 'Run audit'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => router.push(`/${typeLabel}/${params.id}/edit`)}
                className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
              >
                Back to editor
              </button>
              <button
                type="button"
                onClick={() => router.push(`/analytics/${params.id}`)}
                className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
              >
                Open analytics
              </button>
            </div>
          </aside>
        </div>
      </div>
    </FeaturePage>
  );
}
