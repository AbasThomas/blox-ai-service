'use client';

import { useCallback, useEffect, useState } from 'react';
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

/** Run a fully client-side SEO pre-flight against the current form values. */
function runLocalSeoAudit(form: SeoForm): SeoAudit {
  const checks: SeoAuditCheck[] = [];

  // Title
  const titleLen = form.title.trim().length;
  checks.push({
    label: `Title length: ${titleLen} chars (ideal 50–60)`,
    passed: titleLen >= 50 && titleLen <= 60,
    suggestion: titleLen < 50
      ? 'Title is too short — add your role or location (e.g. "Thomas – React Developer | Lagos").'
      : titleLen > 60
      ? 'Title is too long — Google truncates after 60 chars. Trim it.'
      : undefined,
  });

  // Description
  const descLen = form.description.trim().length;
  checks.push({
    label: `Description length: ${descLen} chars (ideal 150–160)`,
    passed: descLen >= 150 && descLen <= 160,
    suggestion: descLen < 150
      ? 'Description is too short — add skills, location, and a call to action.'
      : descLen > 160
      ? 'Description is too long — Google truncates after 160 chars. Tighten it.'
      : undefined,
  });

  // Keywords
  const kwCount = form.keywords.split(',').map((k) => k.trim()).filter(Boolean).length;
  checks.push({
    label: `Keywords: ${kwCount} entered (aim for 5–10)`,
    passed: kwCount >= 3,
    suggestion: kwCount < 3
      ? 'Add at least 5 keywords — include your role, tech stack, and location.'
      : undefined,
  });

  // OG image
  const hasOg = form.ogImage.trim().startsWith('http');
  checks.push({
    label: 'Open Graph image URL set',
    passed: hasOg,
    suggestion: hasOg ? undefined : 'Generate an OG image above — it dramatically improves click-through on social.',
  });

  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

interface SeoForm {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  ogImagePrompt: string;
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

function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getKeywords(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join(', ');
  }
  if (typeof value === 'string') return value;
  return '';
}

export default function PreviewPage({ params }: { params: { id: string } }) {
  const [asset, setAsset] = useState<{
    id: string;
    title: string;
    type: string;
    publishedUrl?: string;
    content?: Record<string, unknown>;
    seoConfig?: Record<string, unknown>;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [subdomain, setSubdomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [seoAudit, setSeoAudit] = useState<SeoAudit | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [seoForm, setSeoForm] = useState<SeoForm>(EMPTY_SEO_FORM);
  const [seoRaw, setSeoRaw] = useState<Record<string, unknown>>({});
  const [seoMsg, setSeoMsg] = useState('');
  const [savingSeo, setSavingSeo] = useState(false);
  const [suggestingSeo, setSuggestingSeo] = useState(false);
  const [generatingOg, setGeneratingOg] = useState(false);

  const hydrateSeoForm = (raw: unknown) => {
    const record = toRecord(raw);
    setSeoRaw(record);
    setSeoForm({
      title: getString(record.title),
      description: getString(record.description),
      keywords: getKeywords(record.keywords),
      ogImage: getString(record.ogImage),
      ogImagePrompt: getString(record.ogImagePrompt),
    });
  };

  const load = useCallback(async () => {
    try {
      const data = await assetsApi.getById(params.id) as typeof asset;
      setAsset(data);
      if (data?.title) {
        setSubdomain(data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30));
      }
      hydrateSeoForm(data?.seoConfig);
    } catch {
      // Ignore and leave existing UI state.
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    if (!subdomain.trim()) {
      setPublishMsg('Enter a subdomain.');
      return;
    }

    setPublishing(true);
    setPublishMsg('');
    try {
      await publishApi.publish({ assetId: params.id, subdomain });
      await load();
      setPublishMsg('Published successfully.');
    } catch (err) {
      setPublishMsg(err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Unpublish this asset? The URL will stop working.')) return;
    setUnpublishing(true);
    try {
      await publishApi.unpublish(params.id);
      await load();
      setPublishMsg('Unpublished.');
    } catch {
      setPublishMsg('Unpublish failed.');
    } finally {
      setUnpublishing(false);
    }
  };

  const handleSeoAudit = async () => {
    // Run instant local checks immediately so the user always gets feedback
    const localResult = runLocalSeoAudit(seoForm);
    setSeoAudit(localResult);

    // Also try the backend for deeper ATS/content checks
    setAuditing(true);
    try {
      const data = await scannerApi.atsScore({ assetId: params.id }) as SeoAudit;
      // Merge: keep local checks, append any extra backend checks
      const backendChecks = data?.checks ?? [];
      const mergedChecks = [
        ...localResult.checks,
        ...backendChecks.filter((bc) => !localResult.checks.some((lc) => lc.label === bc.label)),
      ];
      const passed = mergedChecks.filter((c) => c.passed).length;
      setSeoAudit({ score: Math.round((passed / mergedChecks.length) * 100), checks: mergedChecks });
    } catch {
      // Backend unavailable — local result is still shown
    } finally {
      setAuditing(false);
    }
  };

  const handleSuggestSeo = async () => {
    setSuggestingSeo(true);
    setSeoMsg('');
    try {
      const suggestion = await assetsApi.suggestSeo(params.id) as {
        title?: string;
        description?: string;
        keywords?: string[];
        ogImagePrompt?: string;
      };

      setSeoForm((prev) => ({
        ...prev,
        title: suggestion.title ?? prev.title,
        description: suggestion.description ?? prev.description,
        keywords: Array.isArray(suggestion.keywords) ? suggestion.keywords.join(', ') : prev.keywords,
        ogImagePrompt: suggestion.ogImagePrompt ?? prev.ogImagePrompt,
      }));

      setSeoMsg('SEO suggestions generated. Review and save.');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Failed to generate SEO suggestions.');
    } finally {
      setSuggestingSeo(false);
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
          .map((item) => item.trim())
          .filter(Boolean),
        ogImage: seoForm.ogImage.trim() || undefined,
        ogImagePrompt: seoForm.ogImagePrompt.trim() || undefined,
      };

      await assetsApi.update(params.id, { seoConfig: nextSeo });
      setSeoRaw(nextSeo);
      setSeoMsg('SEO settings saved.');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Failed to save SEO settings.');
    } finally {
      setSavingSeo(false);
    }
  };

  const handleGenerateOgImage = async () => {
    setGeneratingOg(true);
    setSeoMsg('');
    try {
      const result = await assetsApi.generateOgImage(params.id) as { ogImage?: string };
      const ogImage = result.ogImage;
      if (typeof ogImage === 'string' && ogImage.length > 0) {
        setSeoForm((prev) => ({ ...prev, ogImage }));
        setSeoRaw((prev) => ({ ...prev, ogImage }));
        setSeoMsg('Open Graph image URL generated.');
      }
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Failed to generate Open Graph image.');
    } finally {
      setGeneratingOg(false);
    }
  };

  const typeLabel = asset?.type?.toLowerCase().replace('_', '-') + 's';

  return (
    <FeaturePage
      title={asset?.title ? `Preview: ${asset.title}` : 'Preview'}
      description="Preview your asset, tune SEO settings, and publish to your Blox subdomain."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                  viewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
            <div className={`${VIEW_WIDTHS[viewMode]} mx-auto min-h-[420px] overflow-hidden rounded-lg bg-white shadow-lg transition-all`}>
              {asset?.publishedUrl ? (
                <iframe src={asset.publishedUrl} className="h-[520px] w-full border-none" title="Asset preview" />
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center space-y-2 text-slate-400">
                  <p className="text-sm font-medium">{asset?.title || 'Your asset'}</p>
                  <p className="text-xs">Publish to see a live preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Publish settings</h3>
            {asset?.publishedUrl ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs text-slate-500">Live URL</p>
                  <a
                    href={asset.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs font-mono text-blue-600 hover:underline"
                  >
                    {asset.publishedUrl}
                  </a>
                </div>
                <button
                  onClick={handleUnpublish}
                  disabled={unpublishing}
                  className="w-full rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {unpublishing ? 'Unpublishing...' : 'Unpublish'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Subdomain</label>
                  <div className="flex items-center overflow-hidden rounded-md border border-slate-300">
                    <input
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-portfolio"
                      className="flex-1 px-3 py-2 text-xs outline-none"
                    />
                    <span className="border-l border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-400">.blox.app</span>
                  </div>
                </div>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            )}
            {publishMsg ? (
              <p className={`mt-2 text-xs ${publishMsg.toLowerCase().includes('success') || publishMsg.toLowerCase().includes('published') ? 'text-green-600' : 'text-red-600'}`}>
                {publishMsg}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">SEO metadata</h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                <span className="flex items-center justify-between">
                  SEO title
                  <span className={`font-mono text-[10px] tabular-nums ${
                    seoForm.title.length > 60 ? 'text-red-500' :
                    seoForm.title.length >= 50 ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {seoForm.title.length}/60
                  </span>
                </span>
                <input
                  value={seoForm.title}
                  onChange={(e) => setSeoForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                <span className="flex items-center justify-between">
                  Description
                  <span className={`font-mono text-[10px] tabular-nums ${
                    seoForm.description.length > 160 ? 'text-red-500' :
                    seoForm.description.length >= 150 ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {seoForm.description.length}/160
                  </span>
                </span>
                <textarea
                  rows={3}
                  value={seoForm.description}
                  onChange={(e) => setSeoForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Keywords (comma separated)
                <input
                  value={seoForm.keywords}
                  onChange={(e) => setSeoForm((prev) => ({ ...prev, keywords: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                OG image prompt
                <textarea
                  rows={2}
                  value={seoForm.ogImagePrompt}
                  onChange={(e) => setSeoForm((prev) => ({ ...prev, ogImagePrompt: e.target.value }))}
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                OG image URL
                <input
                  value={seoForm.ogImage}
                  onChange={(e) => setSeoForm((prev) => ({ ...prev, ogImage: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={handleSuggestSeo}
                disabled={suggestingSeo}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {suggestingSeo ? 'Generating suggestions...' : 'Generate SEO suggestions'}
              </button>
              <button
                onClick={handleGenerateOgImage}
                disabled={generatingOg}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {generatingOg ? 'Generating OG image...' : 'Generate OG image URL'}
              </button>
              <button
                onClick={handleSaveSeo}
                disabled={savingSeo}
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {savingSeo ? 'Saving...' : 'Save SEO settings'}
              </button>
            </div>
            {seoMsg ? <p className="mt-2 text-xs text-slate-600">{seoMsg}</p> : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">SEO audit</h3>
            {seoAudit ? (
              <div className="space-y-3">
                <div className="text-center">
                  <p className={`text-3xl font-black ${seoAudit.score >= 70 ? 'text-green-600' : seoAudit.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                    {seoAudit.score}
                  </p>
                  <p className="text-xs text-slate-500">SEO score</p>
                </div>
                <ul className="space-y-2">
                  {seoAudit.checks.map((check, index) => (
                    <li key={index} className="text-xs">
                      <div className="flex items-start gap-1.5">
                        <span className={`mt-px shrink-0 font-bold ${check.passed ? 'text-green-500' : 'text-red-500'}`}>
                          {check.passed ? '✓' : '✗'}
                        </span>
                        <span className={check.passed ? 'text-slate-600' : 'text-slate-900 font-medium'}>{check.label}</span>
                      </div>
                      {!check.passed && check.suggestion ? (
                        <p className="ml-4 mt-0.5 text-[10px] leading-relaxed text-slate-500">{check.suggestion}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mb-3 text-xs text-slate-400">Run an audit to check for SEO issues.</p>
            )}
            <button
              onClick={handleSeoAudit}
              disabled={auditing}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {auditing ? 'Auditing...' : 'Run SEO audit'}
            </button>
          </div>

          {asset ? (
            <a
              href={`/${typeLabel}/${params.id}/edit`}
              className="block rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to editor
            </a>
          ) : null}
        </aside>
      </div>
    </FeaturePage>
  );
}
