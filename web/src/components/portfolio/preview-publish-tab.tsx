'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { assetsApi, publishApi, scannerApi } from '@/lib/api';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import {
  DEFAULT_PORTFOLIO_TEMPLATE_ID,
  normalizePortfolioTemplateId,
} from '@/lib/portfolio-templates';
import { buildPreviewProfile } from '@/lib/portfolio-preview';
import { TemplatePicker } from './template-picker';
import { PortfolioTemplateRenderer } from './templates/PortfolioTemplateRenderer';
import { ArrowUpRight, Globe, Sparkles, Zap } from '@/components/ui/icons';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface SeoAuditCheck { label: string; passed: boolean; suggestion?: string; }
interface SeoAudit { score: number; checks: SeoAuditCheck[]; }
interface SeoForm { title: string; description: string; keywords: string; ogImage: string; ogImagePrompt: string; }

const EMPTY_SEO: SeoForm = { title: '', description: '', keywords: '', ogImage: '', ogImagePrompt: '' };

const VIEW_WIDTHS: Record<ViewMode, string> = {
  desktop: 'w-full',
  tablet: 'max-w-[768px]',
  mobile: 'max-w-[375px]',
};

function toRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function asStr(v: unknown): string { return typeof v === 'string' ? v : ''; }
function asKeywords(v: unknown): string {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string').join(', ');
  return asStr(v);
}
function normSub(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function runLocalSeoAudit(form: SeoForm): SeoAudit {
  const tl = form.title.trim().length;
  const dl = form.description.trim().length;
  const kc = form.keywords.split(',').map((s) => s.trim()).filter(Boolean).length;
  const hasOg = form.ogImage.trim().startsWith('http');
  const checks: SeoAuditCheck[] = [
    { label: `Title: ${tl} chars (50–60)`, passed: tl >= 50 && tl <= 60, suggestion: 'Aim for 50–60 characters.' },
    { label: `Description: ${dl} chars (150–160)`, passed: dl >= 150 && dl <= 160, suggestion: 'Aim for 150–160 characters.' },
    { label: `Keywords: ${kc} entered`, passed: kc >= 3, suggestion: 'Add at least 3 keywords.' },
    { label: 'OG image set', passed: hasOg, suggestion: 'Generate or add an OG image URL.' },
  ];
  return { score: Math.round((checks.filter((c) => c.passed).length / checks.length) * 100), checks };
}

function resolvePublicUrl(publishedUrl: string, subdomain: string): string {
  if (!publishedUrl && !subdomain) return '';
  if (!publishedUrl) return `${window.location.origin}/${subdomain}`;
  try {
    const p = new URL(publishedUrl);
    const isLocal = p.hostname === 'localhost' || p.hostname === '127.0.0.1' || p.hostname.endsWith('.localhost');
    if (isLocal && subdomain) return `${window.location.origin}/${subdomain}`;
    return p.toString();
  } catch {
    return subdomain ? `${window.location.origin}/${subdomain}` : publishedUrl;
  }
}

/* ─── Section heading ─────────────────────────────────────────────────────── */
function Heading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-400">{children}</p>;
}

const INPUT_CLS = 'w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-colors placeholder:text-slate-600';
const TEXTAREA_CLS = `${INPUT_CLS} resize-y`;
const BTN_GHOST = 'w-full rounded-xl border border-white/8 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60 transition-colors';
const BTN_PRIMARY = 'w-full rounded-xl bg-[#1ECEFA] px-3 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-60 transition-colors';

interface PreviewPublishTabProps {
  assetId: string;
}

export function PreviewPublishTab({ assetId }: PreviewPublishTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_PORTFOLIO_TEMPLATE_ID);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState<'ok' | 'error' | 'info'>('info');
  const [seoForm, setSeoForm] = useState<SeoForm>(EMPTY_SEO);
  const [seoRaw, setSeoRaw] = useState<Record<string, unknown>>({});
  const [seoMsg, setSeoMsg] = useState('');
  const [seoMsgKind, setSeoMsgKind] = useState<'ok' | 'error'>('ok');
  const [savingSeo, setSavingSeo] = useState(false);
  const [suggestingSeo, setSuggestingSeo] = useState(false);
  const [generatingOg, setGeneratingOg] = useState(false);
  const [seoAudit, setSeoAudit] = useState<SeoAudit | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [rawContent, setRawContent] = useState<Record<string, unknown>>({});

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return resolvePublicUrl(publishedUrl, normSub(subdomain));
  }, [publishedUrl, subdomain]);

  const load = useCallback(async () => {
    try {
      const data = (await assetsApi.getById(assetId)) as {
        slug?: string; title?: string; publishedUrl?: string; content?: unknown; seoConfig?: unknown;
      };
      const seeded = normSub(asStr(data.slug) || asStr(data.title));
      if (seeded) setSubdomain(seeded);
      if (data.publishedUrl) setPublishedUrl(data.publishedUrl);
      const content = toRecord(data.content);
      setRawContent(content);
      setTemplateId(normalizePortfolioTemplateId(asStr(content.templateId)));
      const seo = toRecord(data.seoConfig);
      setSeoRaw(seo);
      setSeoForm({
        title: asStr(seo.title),
        description: asStr(seo.description),
        keywords: asKeywords(seo.keywords),
        ogImage: asStr(seo.ogImage),
        ogImagePrompt: asStr(seo.ogImagePrompt),
      });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not load preview data.');
      setMsgKind('error');
    }
  }, [assetId]);

  useEffect(() => { void load(); }, [load]);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true); setMsg('');
    try {
      const nextId = normalizePortfolioTemplateId(templateId);
      const nextContent = { ...rawContent, templateId: nextId };
      await assetsApi.update(assetId, { content: nextContent });
      setTemplateId(nextId);
      setRawContent(nextContent);
      setMsg('Template saved. Publish to apply it.');
      setMsgKind('ok');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save template.');
      setMsgKind('error');
    } finally { setSavingTemplate(false); }
  };

  const handlePublish = async () => {
    const sub = normSub(subdomain);
    if (!sub) { setMsg('Enter a valid subdomain.'); setMsgKind('error'); return; }
    setPublishing(true); setMsg('');
    try {
      const res = (await publishApi.publish({ assetId, subdomain: sub })) as { publishedUrl?: string; subdomain?: string; status?: string };
      const newSub = normSub(res.subdomain ?? sub);
      setSubdomain(newSub);
      if (res.publishedUrl) setPublishedUrl(res.publishedUrl);
      setMsg(res.status === 'scheduled' ? 'Publish scheduled.' : 'Published successfully!');
      setMsgKind('ok');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Publish failed.'); setMsgKind('error');
    } finally { setPublishing(false); }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this portfolio?')) return;
    setUnpublishing(true); setMsg('');
    try {
      await publishApi.unpublish(assetId);
      setPublishedUrl('');
      setMsg('Unpublished.'); setMsgKind('info');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Unpublish failed.'); setMsgKind('error');
    } finally { setUnpublishing(false); }
  };

  const handleSuggestSeo = async () => {
    setSuggestingSeo(true); setSeoMsg('');
    try {
      const s = (await assetsApi.suggestSeo(assetId)) as { title?: string; description?: string; keywords?: string[]; ogImagePrompt?: string };
      setSeoForm((p) => ({
        ...p,
        title: s.title ?? p.title,
        description: s.description ?? p.description,
        keywords: Array.isArray(s.keywords) ? s.keywords.join(', ') : p.keywords,
        ogImagePrompt: s.ogImagePrompt ?? p.ogImagePrompt,
      }));
      setSeoMsg('AI suggestions applied.'); setSeoMsgKind('ok');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Could not generate suggestions.'); setSeoMsgKind('error');
    } finally { setSuggestingSeo(false); }
  };

  const handleGenerateOgImage = async () => {
    setGeneratingOg(true); setSeoMsg('');
    try {
      const r = (await assetsApi.generateOgImage(assetId)) as { ogImage?: string };
      if (r.ogImage) { setSeoForm((p) => ({ ...p, ogImage: r.ogImage! })); setSeoRaw((p) => ({ ...p, ogImage: r.ogImage })); }
      setSeoMsg('OG image generated.'); setSeoMsgKind('ok');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Could not generate OG image.'); setSeoMsgKind('error');
    } finally { setGeneratingOg(false); }
  };

  const handleSaveSeo = async () => {
    setSavingSeo(true); setSeoMsg('');
    try {
      const next = {
        ...seoRaw,
        title: seoForm.title.trim(),
        description: seoForm.description.trim(),
        keywords: seoForm.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        ogImage: seoForm.ogImage.trim() || undefined,
        ogImagePrompt: seoForm.ogImagePrompt.trim() || undefined,
      };
      await assetsApi.update(assetId, { seoConfig: next });
      setSeoRaw(next);
      setSeoMsg('SEO settings saved.'); setSeoMsgKind('ok');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Could not save SEO.'); setSeoMsgKind('error');
    } finally { setSavingSeo(false); }
  };

  const handleRunAudit = async () => {
    const local = runLocalSeoAudit(seoForm);
    setSeoAudit(local);
    setAuditing(true);
    try {
      const server = (await scannerApi.atsScore({ assetId })) as SeoAudit;
      const merged = [
        ...local.checks,
        ...(server.checks ?? []).filter((c) => !local.checks.some((l) => l.label === c.label)),
      ];
      setSeoAudit({ score: Math.round((merged.filter((c) => c.passed).length / Math.max(merged.length, 1)) * 100), checks: merged });
    } catch { /* local audit still shown */ }
    finally { setAuditing(false); }
  };

  const isLive = !!publishedUrl;

  return (
    <div className="space-y-6">
      {/* Global message */}
      {msg && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-xs ${
          msgKind === 'error' ? 'border-rose-500/20 bg-rose-500/8 text-rose-300'
          : msgKind === 'ok' ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
          : 'border-white/8 bg-white/[0.03] text-slate-300'
        }`}>
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg('')} className="ml-auto text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* ── Left: Template picker + Preview ── */}
        <div className="space-y-5">

          {/* Template picker */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Heading>Choose a template</Heading>
              <button type="button" onClick={() => void handleSaveTemplate()} disabled={savingTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1ECEFA] px-3 py-1.5 text-xs font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-60 transition-colors">
                {savingTemplate ? 'Saving…' : 'Apply template'}
              </button>
            </div>
            <TemplatePicker value={templateId} onChange={setTemplateId} columns={3} />
          </div>

          {/* Preview viewport */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Heading>Preview</Heading>
              <div className="flex items-center gap-1.5">
                {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setViewMode(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                      viewMode === m ? 'bg-purple-500 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}>
                    {m}
                  </button>
                ))}
                {publicUrl && (
                  <a href={publicUrl} target="_blank" rel="noreferrer"
                    className="ml-1 inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 transition-colors">
                    <Globe className="h-3 w-3" /> Live <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-center overflow-hidden rounded-xl border border-white/8 bg-[#060A12]">
              <div className={`${VIEW_WIDTHS[viewMode]} mx-auto w-full transition-all duration-300`}>
                {isLive ? (
                  <iframe src={publicUrl} className="h-[560px] w-full rounded-xl border-none" title="Portfolio preview" />
                ) : (
                  <div className="flex h-[400px] flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="h-12 w-12 rounded-xl bg-[#1ECEFA]/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-[#1ECEFA]" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">Not published yet</p>
                    <p className="text-xs text-slate-600 max-w-[240px]">Publish your portfolio to see a live preview here. The template you selected will be applied.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar: Publish + SEO ── */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">

          {/* Publish settings */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Heading>Publish settings</Heading>
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                </span>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] text-slate-500">Subdomain</p>
              <div className="flex overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] focus-within:border-indigo-500/40 transition-colors">
                <input value={subdomain} onChange={(e) => setSubdomain(normSub(e.target.value))}
                  placeholder="my-portfolio"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600" />
                <span className="flex items-center border-l border-white/8 px-3 text-xs text-slate-500 whitespace-nowrap">.blox.app</span>
              </div>
            </div>

            <button type="button" onClick={() => void handlePublish()} disabled={publishing} className={BTN_PRIMARY}>
              {publishing ? 'Publishing…' : isLive ? 'Re-publish' : 'Publish Now'}
            </button>

            {isLive && (
              <button type="button" onClick={() => void handleUnpublish()} disabled={unpublishing}
                className="w-full rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/12 disabled:opacity-60 transition-colors">
                {unpublishing ? 'Unpublishing…' : 'Unpublish'}
              </button>
            )}

            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noreferrer"
                className="block break-all rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/12 transition-colors">
                {publicUrl}
              </a>
            )}
          </div>

          {/* SEO metadata */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Heading>SEO Metadata</Heading>
              <button type="button" onClick={() => void handleSuggestSeo()} disabled={suggestingSeo}
                className="inline-flex items-center gap-1 text-[11px] text-[#1ECEFA] hover:text-white transition-colors disabled:opacity-60">
                <Sparkles className="h-3 w-3" /> {suggestingSeo ? 'Generating…' : 'Auto-fill'}
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] text-slate-500">Title <span className="text-slate-600">({seoForm.title.length}/60)</span></span>
                <input value={seoForm.title} onChange={(e) => setSeoForm((p) => ({ ...p, title: e.target.value }))}
                  className={INPUT_CLS} placeholder="e.g. John Doe — Frontend Engineer" />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-slate-500">Description <span className="text-slate-600">({seoForm.description.length}/160)</span></span>
                <textarea rows={3} value={seoForm.description} onChange={(e) => setSeoForm((p) => ({ ...p, description: e.target.value }))}
                  className={TEXTAREA_CLS} placeholder="A results-driven engineer…" />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-slate-500">Keywords <span className="text-slate-600">(comma-separated)</span></span>
                <input value={seoForm.keywords} onChange={(e) => setSeoForm((p) => ({ ...p, keywords: e.target.value }))}
                  className={INPUT_CLS} placeholder="react, typescript, fintech" />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-slate-500">OG image URL</span>
                <div className="flex gap-1.5">
                  <input value={seoForm.ogImage} onChange={(e) => setSeoForm((p) => ({ ...p, ogImage: e.target.value }))}
                    className={INPUT_CLS + ' flex-1'} placeholder="https://..." />
                  <button type="button" onClick={() => void handleGenerateOgImage()} disabled={generatingOg}
                    title="Generate OG image"
                    className="shrink-0 rounded-xl border border-white/8 px-2.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-60 transition-colors">
                    {generatingOg ? '…' : <Sparkles className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </label>
            </div>

            <button type="button" onClick={() => void handleSaveSeo()} disabled={savingSeo} className={BTN_PRIMARY}>
              {savingSeo ? 'Saving…' : 'Save SEO'}
            </button>

            {seoMsg && (
              <p className={`text-[11px] ${seoMsgKind === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{seoMsg}</p>
            )}
          </div>

          {/* SEO Audit */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Heading>SEO Audit</Heading>
              {seoAudit && (
                <span className={`text-sm font-bold ${seoAudit.score >= 75 ? 'text-emerald-300' : seoAudit.score >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                  {seoAudit.score}
                </span>
              )}
            </div>

            {seoAudit ? (
              <div className="space-y-2">
                <div className="h-1 rounded-full bg-white/8">
                  <div className="h-1 rounded-full transition-all"
                    style={{ width: `${seoAudit.score}%`, background: seoAudit.score >= 75 ? '#34d399' : seoAudit.score >= 50 ? '#fbbf24' : '#f87171' }} />
                </div>
                {seoAudit.checks.map((c) => (
                  <div key={c.label} className="flex items-start gap-2">
                    <span className={`mt-0.5 text-xs font-bold ${c.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{c.passed ? '✓' : '✗'}</span>
                    <div>
                      <p className={`text-[11px] ${c.passed ? 'text-slate-300' : 'text-slate-400'}`}>{c.label}</p>
                      {!c.passed && c.suggestion && <p className="text-[10px] text-slate-600 mt-0.5">{c.suggestion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-600">Run an audit to check SEO quality.</p>
            )}

            <button type="button" onClick={() => void handleRunAudit()} disabled={auditing} className={BTN_GHOST}>
              <Zap className="mr-1.5 inline h-3.5 w-3.5" />
              {auditing ? 'Auditing…' : 'Run SEO Audit'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
