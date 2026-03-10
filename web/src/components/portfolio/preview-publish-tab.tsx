'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { assetsApi, publishApi, scannerApi } from '@/lib/api';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import {
  DEFAULT_PORTFOLIO_TEMPLATE_ID,
  normalizePortfolioTemplateId,
} from '@/lib/portfolio-templates';
import { buildPreviewProfile } from '@/lib/portfolio-preview';
import { TemplatePicker } from './template-picker';
import { PortfolioTemplateRenderer } from './templates/PortfolioTemplateRenderer';
import { CodeEditorModal, type CodeCustomizations } from './code-editor/CodeEditorModal';
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

/* ─── Alert Modal ──────────────────────────────────────────────────────────── */

type AlertKind = 'ok' | 'error' | 'info';

interface AlertState {
  kind: AlertKind;
  title: string;
  message?: string;
}

const ALERT_DURATION = 5000; // ms before auto-close

const ALERT_CONFIG: Record<AlertKind, {
  bg: string; border: string; iconBg: string; iconColor: string;
  barColor: string; icon: React.ReactNode;
}> = {
  ok: {
    bg: 'rgba(6, 24, 18, 0.97)',
    border: 'rgba(52, 211, 153, 0.3)',
    iconBg: 'rgba(52, 211, 153, 0.12)',
    iconColor: '#34d399',
    barColor: '#34d399',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  error: {
    bg: 'rgba(24, 6, 6, 0.97)',
    border: 'rgba(248, 113, 113, 0.3)',
    iconBg: 'rgba(248, 113, 113, 0.12)',
    iconColor: '#f87171',
    barColor: '#f87171',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  info: {
    bg: 'rgba(10, 10, 30, 0.97)',
    border: 'rgba(99, 102, 241, 0.3)',
    iconBg: 'rgba(99, 102, 241, 0.12)',
    iconColor: '#818cf8',
    barColor: '#818cf8',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

function AlertModal({ alert, onClose }: { alert: AlertState; onClose: () => void }) {
  const cfg = ALERT_CONFIG[alert.kind];
  const [progress, setProgress] = useState(100);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / ALERT_DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onClose();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99990, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
        style={{
          maxWidth: 460,
          margin: '0 1rem',
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          animation: 'alert-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center">
          {/* Icon */}
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: cfg.iconBg, color: cfg.iconColor, border: `1px solid ${cfg.border}` }}
          >
            {cfg.icon}
          </div>

          {/* Title */}
          <p className="text-[18px] font-bold leading-tight text-white">
            {alert.title}
          </p>

          {/* Message */}
          {alert.message && (
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'rgba(148,163,184,1)' }}>
              {alert.message}
            </p>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-xl px-6 py-2.5 text-[13px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ background: cfg.iconColor, color: '#060a10' }}
          >
            Got it
          </button>
        </div>

        {/* Countdown progress bar */}
        <div className="h-[3px] w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full transition-none"
            style={{ width: `${progress}%`, background: cfg.barColor, borderRadius: 2 }}
          />
        </div>
      </div>

      <style>{`
        @keyframes alert-in {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

function useAlert() {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const show = useCallback((kind: AlertKind, title: string, message?: string) => {
    setAlert({ kind, title, message });
  }, []);

  const close = useCallback(() => setAlert(null), []);

  return { alert, show, close };
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-400">{children}</p>;
}

const INPUT_CLS = 'w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-colors placeholder:text-slate-600';
const TEXTAREA_CLS = `${INPUT_CLS} resize-y`;
const BTN_GHOST = 'w-full rounded-xl border border-white/8 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60 transition-colors';
const BTN_PRIMARY = 'w-full rounded-xl bg-[#1ECEFA] px-3 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-60 transition-colors';

/* ─── Main Component ───────────────────────────────────────────────────────── */

interface PreviewPublishTabProps { assetId: string; }

export function PreviewPublishTab({ assetId }: PreviewPublishTabProps) {
  const { alert, show: showAlert, close: closeAlert } = useAlert();

  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_PORTFOLIO_TEMPLATE_ID);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [seoForm, setSeoForm] = useState<SeoForm>(EMPTY_SEO);
  const [seoRaw, setSeoRaw] = useState<Record<string, unknown>>({});
  const [savingSeo, setSavingSeo] = useState(false);
  const [suggestingSeo, setSuggestingSeo] = useState(false);
  const [generatingOg, setGeneratingOg] = useState(false);
  const [seoAudit, setSeoAudit] = useState<SeoAudit | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [rawContent, setRawContent] = useState<Record<string, unknown>>({});
  const [assetTitle, setAssetTitle] = useState('');
  const [assetUser, setAssetUser] = useState<{ fullName?: string; email?: string }>({});
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [codeCustomizations, setCodeCustomizations] = useState<CodeCustomizations>({ css: '', config: '' });

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return resolvePublicUrl(publishedUrl, normSub(subdomain));
  }, [publishedUrl, subdomain]);

  const previewProfile = useMemo<PublicProfilePayload>(() => {
    return buildPreviewProfile({
      content: rawContent, title: assetTitle, seoConfig: seoRaw,
      user: assetUser, subdomain: normSub(subdomain) || 'preview',
      publishedUrl: publicUrl, templateId,
    });
  }, [rawContent, assetTitle, seoRaw, assetUser, subdomain, publicUrl, templateId]);

  const load = useCallback(async () => {
    try {
      const data = (await assetsApi.getById(assetId)) as {
        slug?: string; title?: string; publishedUrl?: string;
        content?: unknown; seoConfig?: unknown;
        user?: { fullName?: string; email?: string };
      };
      const seeded = normSub(asStr(data.slug) || asStr(data.title));
      if (seeded) setSubdomain(seeded);
      if (data.publishedUrl) setPublishedUrl(data.publishedUrl);
      setAssetTitle(asStr(data.title));
      setAssetUser({ fullName: asStr(data.user?.fullName) || undefined, email: asStr(data.user?.email) || undefined });
      const content = toRecord(data.content);
      setRawContent(content);
      setTemplateId(normalizePortfolioTemplateId(asStr(content.templateId)));
      const customizations = toRecord(content.codeCustomizations);
      setCodeCustomizations({ css: asStr(customizations.css), config: asStr(customizations.config) });
      const seo = toRecord(data.seoConfig);
      setSeoRaw(seo);
      setSeoForm({ title: asStr(seo.title), description: asStr(seo.description), keywords: asKeywords(seo.keywords), ogImage: asStr(seo.ogImage), ogImagePrompt: asStr(seo.ogImagePrompt) });
    } catch (err) {
      showAlert('error', 'Could not load preview', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [assetId, showAlert]);

  useEffect(() => { void load(); }, [load]);

  const persistTemplateSelection = useCallback(async () => {
    const nextId = normalizePortfolioTemplateId(templateId);
    if (asStr(rawContent.templateId) === nextId) return;
    const nextContent = { ...rawContent, templateId: nextId };
    await assetsApi.update(assetId, { content: nextContent });
    setRawContent(nextContent);
    setTemplateId(nextId);
  }, [assetId, rawContent, templateId]);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await persistTemplateSelection();
      showAlert('ok', 'Template applied!', 'Your template selection has been saved successfully.');
    } catch (err) {
      showAlert('error', 'Template save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally { setSavingTemplate(false); }
  };

  const handlePublish = async () => {
    const sub = normSub(subdomain);
    if (!sub) { showAlert('error', 'Invalid subdomain', 'Enter a valid subdomain to publish.'); return; }
    setPublishing(true);
    try {
      await persistTemplateSelection();
      const res = (await publishApi.publish({ assetId, subdomain: sub })) as { publishedUrl?: string; subdomain?: string; status?: string };
      const newSub = normSub(res.subdomain ?? sub);
      setSubdomain(newSub);
      if (res.publishedUrl) setPublishedUrl(res.publishedUrl);
      showAlert('ok', res.status === 'scheduled' ? 'Publish Scheduled' : 'Portfolio Published!', `Your portfolio is live at ${newSub}.blox.app`);
    } catch (err) {
      showAlert('error', 'Publish Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally { setPublishing(false); }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this portfolio?')) return;
    setUnpublishing(true);
    try {
      await publishApi.unpublish(assetId);
      setPublishedUrl('');
      showAlert('info', 'Portfolio Unpublished', 'Your portfolio is no longer publicly accessible.');
    } catch (err) {
      showAlert('error', 'Unpublish Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally { setUnpublishing(false); }
  };

  const handleSuggestSeo = async () => {
    setSuggestingSeo(true);
    try {
      const s = (await assetsApi.suggestSeo(assetId)) as { title?: string; description?: string; keywords?: string[]; ogImagePrompt?: string };
      setSeoForm((p) => ({
        ...p,
        title: s.title ?? p.title,
        description: s.description ?? p.description,
        keywords: Array.isArray(s.keywords) ? s.keywords.join(', ') : p.keywords,
        ogImagePrompt: s.ogImagePrompt ?? p.ogImagePrompt,
      }));
      showAlert('ok', 'SEO Suggestions Applied', 'AI-generated metadata has been filled in. Review and save when ready.');
    } catch (err) {
      showAlert('error', 'Could Not Generate Suggestions', err instanceof Error ? err.message : 'Unknown error');
    } finally { setSuggestingSeo(false); }
  };

  const handleGenerateOgImage = async () => {
    setGeneratingOg(true);
    try {
      const r = (await assetsApi.generateOgImage(assetId)) as { ogImage?: string };
      if (r.ogImage) { setSeoForm((p) => ({ ...p, ogImage: r.ogImage! })); setSeoRaw((p) => ({ ...p, ogImage: r.ogImage })); }
      showAlert('ok', 'OG Image Generated', 'Your open-graph image is ready. Save SEO settings to apply it.');
    } catch (err) {
      showAlert('error', 'OG Image Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally { setGeneratingOg(false); }
  };

  const handleSaveSeo = async () => {
    setSavingSeo(true);
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
      showAlert('ok', 'SEO Settings Saved', 'Your metadata has been updated and will apply on next publish.');
    } catch (err) {
      showAlert('error', 'Could Not Save SEO', err instanceof Error ? err.message : 'Unknown error');
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
      const finalScore = Math.round((merged.filter((c) => c.passed).length / Math.max(merged.length, 1)) * 100);
      setSeoAudit({ score: finalScore, checks: merged });
      showAlert(finalScore >= 75 ? 'ok' : finalScore >= 50 ? 'info' : 'error', `SEO Score: ${finalScore}/100`, finalScore >= 75 ? 'Great job! Your SEO is well optimised.' : 'Some improvements are needed — check the audit results below.');
    } catch {
      showAlert('info', `SEO Score: ${local.score}/100`, 'Local audit complete. Connect to server for a full scan.');
    } finally { setAuditing(false); }
  };

  const handleSaveCode = useCallback(async (customizations: CodeCustomizations) => {
    const nextContent = { ...rawContent, codeCustomizations: customizations };
    await assetsApi.update(assetId, { content: nextContent });
    setRawContent(nextContent);
    setCodeCustomizations(customizations);
    showAlert('ok', 'Code Customizations Saved', 'Your CSS changes are saved and will appear on the published portfolio.');
  }, [assetId, rawContent, showAlert]);

  const handleOpenCodeEditor = useCallback((id: string) => {
    setTemplateId(id);
    setCodeEditorOpen(true);
  }, []);

  const isLive = !!publishedUrl;

  return (
    <>
      {/* Alert modal (portal — renders at document.body) */}
      {alert && <AlertModal alert={alert} onClose={closeAlert} />}

      {/* Code editor modal (portal) */}
      <CodeEditorModal
        isOpen={codeEditorOpen}
        onClose={() => setCodeEditorOpen(false)}
        templateId={templateId}
        profile={previewProfile}
        initialCss={codeCustomizations.css}
        initialConfig={codeCustomizations.config}
        onSave={handleSaveCode}
      />

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <div
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30,206,250,0.07) 0%, rgba(99,102,241,0.05) 100%)',
          borderColor: 'rgba(30,206,250,0.18)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(30,206,250,0.12)', border: '1px solid rgba(30,206,250,0.25)' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1ECEFA" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Template Code Editor</p>
            <p className="text-[11px] text-slate-500">
              Edit CSS &amp; config — changes apply live in the editor preview
              {codeCustomizations.css && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[#1ECEFA]/25 bg-[#1ECEFA]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#1ECEFA]">
                  ✦ custom code active
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCodeEditor(templateId)}
          className="shrink-0 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:brightness-110 active:scale-95"
          style={{ background: '#1ECEFA', color: '#060a10' }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
          Open Code Editor
        </button>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

        {/* ── Left: Template picker + Preview ── */}
        <div className="space-y-5">

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Heading>Choose a template</Heading>
              <button
                type="button"
                onClick={() => void handleSaveTemplate()}
                disabled={savingTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1ECEFA] px-3 py-1.5 text-xs font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-60 transition-colors"
              >
                {savingTemplate ? 'Saving…' : 'Apply template'}
              </button>
            </div>
            <TemplatePicker
              value={templateId}
              onChange={setTemplateId}
              columns={3}
              onEditCode={handleOpenCodeEditor}
            />
          </div>

          {/* Preview — NOTE: we do NOT inject codeCustomizations.css here.
              CSS rules would apply globally and break the sidebar + other UI.
              The code editor's full-screen preview is the right place for that. */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Heading>Preview</Heading>
              <div className="flex items-center gap-1.5">
                {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setViewMode(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                      viewMode === m ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
              <div className={`${VIEW_WIDTHS[viewMode]} relative isolate mx-auto h-[640px] w-full overflow-y-auto transition-all duration-300`}>
                <PortfolioTemplateRenderer
                  profile={previewProfile}
                  subdomain={normSub(subdomain) || previewProfile.subdomain}
                  templateId={templateId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">

          {/* Publish */}
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
    </>
  );
}
