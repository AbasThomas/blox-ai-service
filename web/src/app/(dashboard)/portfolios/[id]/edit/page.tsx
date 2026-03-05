'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { assetsApi, scannerApi } from '@/lib/api';
import { AppLoadingScreen } from '@/components/shared/app-loading-screen';
import { TemplatePicker } from '@/components/portfolio/template-picker';
import {
  DEFAULT_PORTFOLIO_TEMPLATE_ID,
  normalizePortfolioTemplateId,
} from '@/lib/portfolio-templates';
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle,
  Globe,
  History,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Zap,
} from '@/components/ui/icons';

type Step = 1 | 2 | 3;
type ContentRecord = Record<string, unknown>;
type NoticeKind = 'error' | 'ok' | 'info';

interface EditorContent {
  templateId: string;
  focusQuestion: string;
  profileImageUrl: string;
  heroHeading: string;
  heroBody: string;
  about: string;
  contact: string;
  experience: string[];
  projects: string[];
  skills: string[];
  certifications: string[];
}

interface VersionRow {
  id: string;
  label: string;
  createdAt: string;
}

interface AssetResponse {
  id: string;
  title: string;
  content?: ContentRecord;
  healthScore?: number;
  publishedUrl?: string | null;
  generatingStatus?: string;
}

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Content' },
  { id: 3, label: 'Publish' },
];

const EMPTY_EDITOR_CONTENT: EditorContent = {
  templateId: DEFAULT_PORTFOLIO_TEMPLATE_ID,
  focusQuestion: '',
  profileImageUrl: '',
  heroHeading: '',
  heroBody: '',
  about: '',
  contact: '',
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}
function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function asString(value: unknown): string { return typeof value === 'string' ? value : ''; }

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function stringifyProjectItem(item: unknown): string {
  if (typeof item === 'string') return item;
  const row = asRecord(item);
  const imageList = [
    ...asArray(row.images)
      .map((image) => {
        if (typeof image === 'string') return image;
        return asString(asRecord(image).url || asRecord(image).imageUrl);
      })
      .filter(Boolean),
    ...asArray(row.gallery)
      .map((image) => {
        if (typeof image === 'string') return image;
        return asString(asRecord(image).url || asRecord(image).imageUrl);
      })
      .filter(Boolean),
  ];
  const snapshot =
    asString(row.snapshotUrl) ||
    asString(row.thumbnail) ||
    asString(row.imageUrl) ||
    imageList[0] ||
    '';
  return serializeProjectLine({
    title: asString(row.title) || asString(row.name),
    description: asString(row.description),
    url: asString(row.url),
    snapshotUrl: snapshot,
    images: imageList,
  });
}

function stringifyCertificationItem(item: unknown): string {
  if (typeof item === 'string') return item;
  const row = asRecord(item);
  return [asString(row.title) || asString(row.name), asString(row.issuer), asString(row.date) || asString(row.completedAt)].filter(Boolean).join(' | ');
}

function stringifyGenericItem(item: unknown): string {
  if (typeof item === 'string') return item;
  return Object.values(asRecord(item)).map((v) => asString(v).trim()).filter(Boolean).join(' | ');
}

function extractItemList(source: unknown, kind: 'generic' | 'projects' | 'certifications') {
  const record = asRecord(source);
  const rawItems = asArray(record.items);
  const items = rawItems.length > 0 ? rawItems : asArray(source);
  const parser = kind === 'projects' ? stringifyProjectItem : kind === 'certifications' ? stringifyCertificationItem : stringifyGenericItem;
  return items.map(parser).map((i) => i.trim()).filter(Boolean);
}

function normalizeContent(raw: ContentRecord | undefined): EditorContent {
  if (!raw) return EMPTY_EDITOR_CONTENT;
  const hero = asRecord(raw.hero);
  const about = asRecord(raw.about);
  const contact = asRecord(raw.contact);
  const profile = asRecord(raw.profile);
  const meta = asRecord(raw.meta);
  return {
    templateId: normalizePortfolioTemplateId(asString(raw.templateId)),
    focusQuestion: asString(meta.focusQuestion),
    profileImageUrl: asString(profile.avatarUrl),
    heroHeading: asString(hero.heading),
    heroBody: asString(hero.body),
    about: asString(about.body),
    contact: asString(contact.body),
    experience: extractItemList(raw.experience, 'generic'),
    projects: extractItemList(raw.projects, 'projects'),
    skills: extractItemList(raw.skills, 'generic'),
    certifications: extractItemList(raw.certifications, 'certifications'),
  };
}

interface ProjectEditorLine {
  title: string;
  description: string;
  url: string;
  snapshotUrl: string;
  images: string[];
}

function parseProjectEditorLine(line: string): ProjectEditorLine {
  const [title = '', description = '', url = '', snapshotUrl = '', imagesRaw = ''] =
    line.split('|').map((chunk) => chunk.trim());
  const images = imagesRaw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return { title, description, url, snapshotUrl, images };
}

function serializeProjectLine(project: ProjectEditorLine): string {
  return [
    project.title.trim(),
    project.description.trim(),
    project.url.trim(),
    project.snapshotUrl.trim(),
    project.images.map((image) => image.trim()).filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' | ');
}

function parseProjectLine(line: string) {
  const parsed = parseProjectEditorLine(line);
  const title = parsed.title || 'Project';
  const snapshotUrl = parsed.snapshotUrl || parsed.images[0] || '';
  const images = parsed.images.filter(Boolean).map((url) => ({ url }));
  return {
    title,
    name: title,
    description: parsed.description,
    ...(parsed.url ? { url: parsed.url } : {}),
    ...(snapshotUrl ? { snapshotUrl, imageUrl: snapshotUrl } : {}),
    ...(images.length > 0 ? { images } : {}),
  };
}

function parseCertificationLine(line: string) {
  const parts = line.split('|').map((c) => c.trim()).filter(Boolean);
  return { title: parts[0] ?? 'Certification', ...(parts[1] ? { issuer: parts[1] } : {}), ...(parts[2] ? { date: parts[2], completedAt: parts[2] } : {}) };
}

function buildUpdatedContent(previous: ContentRecord, editor: EditorContent): ContentRecord {
  const next = { ...previous };
  next.templateId = normalizePortfolioTemplateId(editor.templateId);
  next.meta = { ...asRecord(previous.meta), focusQuestion: editor.focusQuestion.trim() };
  next.profile = { ...asRecord(previous.profile), avatarUrl: editor.profileImageUrl.trim() };
  next.hero = { ...asRecord(previous.hero), heading: editor.heroHeading.trim(), body: editor.heroBody.trim() };
  next.about = { ...asRecord(previous.about), body: editor.about.trim() };
  next.contact = { ...asRecord(previous.contact), body: editor.contact.trim() };
  next.experience = { items: editor.experience.map((i) => i.trim()).filter(Boolean) };
  next.projects = { items: editor.projects.map((i) => i.trim()).filter(Boolean).map(parseProjectLine) };
  next.skills = { items: editor.skills.map((i) => i.trim()).filter(Boolean) };
  next.certifications = { items: editor.certifications.map((i) => i.trim()).filter(Boolean).map(parseCertificationLine) };
  return next;
}

function formatVersionLabel(raw: Record<string, unknown>) {
  return asString(raw.versionLabel) || asString(raw.label) || `Version ${new Date(asString(raw.createdAt) || Date.now()).toLocaleString()}`;
}

/* ─── Field label ─────────────────────────────────────────────────────────── */
function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline gap-2">
      <span className="text-xs font-medium text-slate-400">{children}</span>
      {hint && <span className="text-[11px] text-slate-600">{hint}</span>}
    </div>
  );
}

const INPUT_CLS = 'w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-colors placeholder:text-slate-600';
const TEXTAREA_CLS = `${INPUT_CLS} resize-y`;

/* ─── Section divider ─────────────────────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">{label}</span>
      <div className="flex-1 border-t border-white/5" />
    </div>
  );
}

export default function PortfolioEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState('');
  const [rawContent, setRawContent] = useState<ContentRecord>({});
  const [content, setContent] = useState<EditorContent>(EMPTY_EDITOR_CONTENT);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [critiquing, setCritiquing] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [publishUrl, setPublishUrl] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [healthScore, setHealthScore] = useState(0);
  const [critique, setCritique] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<NoticeKind>('info');
  const [showAiOverlay, setShowAiOverlay] = useState(false);

  function showNotice(msg: string, kind: NoticeKind = 'info') {
    setNotice(msg);
    setNoticeKind(kind);
  }

  const loadAsset = useCallback(async () => {
    try {
      const asset = (await assetsApi.getById(id)) as AssetResponse;
      const assetContent = asRecord(asset.content);
      setTitle(asset.title || '');
      setRawContent(assetContent);
      setContent(normalizeContent(assetContent));
      setHealthScore(typeof asset.healthScore === 'number' ? asset.healthScore : 0);
      setPublishUrl(asset.publishedUrl ?? '');
      setGeneratingStatus(asString(asset.generatingStatus) || asString(assetContent.generatingStatus));
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Could not load portfolio data.', 'error');
    }
  }, [id]);

  const loadVersions = useCallback(async () => {
    try {
      const rows = (await assetsApi.listVersions(id)) as Array<Record<string, unknown>>;
      setVersions(rows.map((row) => ({ id: asString(row.id), label: formatVersionLabel(row), createdAt: asString(row.createdAt) || new Date().toISOString() })));
    } catch { setVersions([]); }
  }, [id]);

  useEffect(() => { void loadAsset(); void loadVersions(); }, [loadAsset, loadVersions]);

  useEffect(() => {
    if (generatingStatus !== 'processing' && generatingStatus !== 'queued') {
      // Generation finished — auto-dismiss overlay
      if (showAiOverlay) setShowAiOverlay(false);
      return;
    }
    const timer = setInterval(() => { void loadAsset(); }, 4000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingStatus, loadAsset]);

  const handleSave = useCallback(async () => {
    setSaving(true); setNotice(''); setSaveMsg('');
    try {
      const updatedContent = buildUpdatedContent(rawContent, content);
      await assetsApi.update(id, { title: title.trim(), content: updatedContent });
      setRawContent(updatedContent);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 1600);
      return true;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Save failed.', 'error');
      return false;
    } finally { setSaving(false); }
  }, [content, id, rawContent, title]);

  const handleGenerate = async () => {
    setGenerating(true); setNotice('');
    try {
      await assetsApi.generate(id);
      setGeneratingStatus('queued');
      setShowAiOverlay(true);
    } catch (error) { showNotice(error instanceof Error ? error.message : 'AI generation failed.', 'error'); }
    finally { setGenerating(false); }
  };

  const handleCritique = async () => {
    setCritiquing(true); setNotice(''); setCritique([]);
    try {
      const res = (await scannerApi.atsScore({ assetId: id })) as { score: number; checks: Array<{ label: string; passed: boolean; suggestion?: string }> };
      setHealthScore(typeof res.score === 'number' ? res.score : 0);
      setCritique((res.checks ?? []).filter((c) => !c.passed && typeof c.suggestion === 'string').map((c) => c.suggestion as string));
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Critique request failed.', 'error'); }
    finally { setCritiquing(false); }
  };

  const handleSaveVersion = async () => {
    try {
      await assetsApi.saveVersion(id, { label: `v${new Date().toLocaleString()}`, branch: 'main' });
      await loadVersions();
      showNotice('Version saved.', 'ok');
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not save version.', 'error'); }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await assetsApi.restoreVersion(id, versionId);
      await loadAsset(); await loadVersions();
      showNotice('Version restored.', 'ok');
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not restore version.', 'error'); }
  };

  const handleProfileImageUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) return;
      setContent((prev) => ({ ...prev, profileImageUrl: dataUrl }));
      showNotice('Profile image added. Save to persist it.', 'info');
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not import profile image.', 'error'); }
  };

  const updateListItem = (key: 'experience' | 'skills' | 'certifications', index: number, value: string) => {
    setContent((prev) => { const next = [...prev[key]]; next[index] = value; return { ...prev, [key]: next }; });
  };
  const addListItem = (key: 'experience' | 'skills' | 'certifications') =>
    setContent((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  const removeListItem = (key: 'experience' | 'skills' | 'certifications', index: number) =>
    setContent((prev) => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== index) }));

  const updateProjectLine = useCallback((index: number, updater: (line: ProjectEditorLine) => ProjectEditorLine) => {
    setContent((prev) => {
      const next = [...prev.projects];
      const parsed = parseProjectEditorLine(next[index] ?? '');
      next[index] = serializeProjectLine(updater(parsed));
      return { ...prev, projects: next };
    });
  }, []);

  const addProject = () =>
    setContent((prev) => ({ ...prev, projects: [...prev.projects, ''] }));

  const removeProject = (index: number) =>
    setContent((prev) => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== index) }));

  const handleProjectImageUpload = async (projectIndex: number, file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) return;
      updateProjectLine(projectIndex, (line) => {
        const images = [...line.images, dataUrl];
        return { ...line, snapshotUrl: line.snapshotUrl || dataUrl, images };
      });
      showNotice('Project image added. Save to persist it.', 'info');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not import project image.', 'error');
    }
  };

  const handleNext = async () => {
    if (step === 1 || step === 2) { const ok = await handleSave(); if (!ok) return; }
    setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
  };

  const scoreColor = useMemo(() =>
    healthScore >= 70 ? '#34d399' : healthScore >= 40 ? '#fbbf24' : '#f87171',
    [healthScore]);

  const scoreLabel = useMemo(() =>
    healthScore >= 70 ? 'text-emerald-300' : healthScore >= 40 ? 'text-amber-300' : 'text-rose-300',
    [healthScore]);

  const projectsCount = content.projects.filter((line) => {
    const parsed = parseProjectEditorLine(line);
    return Boolean(parsed.title.trim() || parsed.description.trim() || parsed.url.trim());
  }).length;
  const certificationsCount = content.certifications.filter((i) => i.trim()).length;
  const skillsCount = content.skills.filter((i) => i.trim()).length;
  const experienceCount = content.experience.filter((i) => i.trim()).length;

  const completionChecks = [
    { label: 'Hero heading added', ok: !!content.heroHeading.trim() },
    { label: 'Hero subtitle written', ok: !!content.heroBody.trim() },
    { label: 'At least one project', ok: projectsCount > 0 },
    { label: 'At least three skills', ok: skillsCount >= 3 },
    { label: 'Contact section added', ok: !!content.contact.trim() },
  ];
  const completionPct = Math.round((completionChecks.filter((c) => c.ok).length / completionChecks.length) * 100);

  const renderListEditor = (key: 'experience' | 'skills' | 'certifications', hint?: string) => (
    <div className="space-y-2">
      {hint ? <p className="text-[11px] text-slate-600">{hint}</p> : null}
      {content[key].length === 0 ? (
        <p className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 text-xs text-slate-600">No entries yet.</p>
      ) : null}
      {content[key].map((item, index) => (
        <div key={`${key}-${index}`} className="flex items-start gap-2">
          <textarea
            rows={key === 'skills' ? 1 : 2}
            value={item}
            onChange={(e) => updateListItem(key, index, e.target.value)}
            className={TEXTAREA_CLS + ' min-w-0 flex-1'}
          />
          <button type="button" onClick={() => removeListItem(key, index)}
            className="mt-1 rounded-lg border border-white/8 px-2.5 py-2 text-xs text-slate-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => addListItem(key)}
        className="w-full rounded-xl border border-dashed border-white/12 px-3 py-2.5 text-xs font-medium text-slate-500 hover:border-indigo-500/40 hover:text-indigo-300 transition-all">
        + Add entry
      </button>
    </div>
  );

  const renderProjectEditor = () => (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-600">
        Add a title, description, URL, snapshot image, and optional gallery images.
      </p>
      {content.projects.length === 0 ? (
        <p className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 text-xs text-slate-600">
          No projects yet.
        </p>
      ) : null}

      {content.projects.map((projectLine, index) => {
        const project = parseProjectEditorLine(projectLine);
        return (
          <div key={`project-${index}`} className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[11px] text-slate-500">Title</span>
                <input
                  value={project.title}
                  onChange={(event) =>
                    updateProjectLine(index, (line) => ({ ...line, title: event.target.value }))
                  }
                  className={INPUT_CLS}
                  placeholder="Project title"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-slate-500">Project URL</span>
                <input
                  value={project.url}
                  onChange={(event) =>
                    updateProjectLine(index, (line) => ({ ...line, url: event.target.value }))
                  }
                  className={INPUT_CLS}
                  placeholder="https://..."
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-500">Description</span>
              <textarea
                rows={3}
                value={project.description}
                onChange={(event) =>
                  updateProjectLine(index, (line) => ({ ...line, description: event.target.value }))
                }
                className={TEXTAREA_CLS}
                placeholder="Describe your project outcome"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-500">Snapshot URL</span>
              <input
                value={project.snapshotUrl}
                onChange={(event) =>
                  updateProjectLine(index, (line) => ({ ...line, snapshotUrl: event.target.value }))
                }
                className={INPUT_CLS}
                placeholder="Primary preview image URL"
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">Gallery images</span>
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      void handleProjectImageUpload(index, event.target.files?.[0] ?? null)
                    }
                  />
                  Upload image
                </label>
              </div>

              {project.images.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.images.map((image, imageIndex) => (
                    <div key={`${image}-${imageIndex}`} className="group relative h-16 w-24 overflow-hidden rounded-md border border-white/10">
                      <img src={image} alt={`Project image ${imageIndex + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          updateProjectLine(index, (line) => ({
                            ...line,
                            images: line.images.filter((_, idx) => idx !== imageIndex),
                            snapshotUrl:
                              line.snapshotUrl === image
                                ? line.images.filter((_, idx) => idx !== imageIndex)[0] ?? ''
                                : line.snapshotUrl,
                          }))
                        }
                        className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-600">No gallery images uploaded.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeProject(index)}
                className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                Remove project
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addProject}
        className="w-full rounded-xl border border-dashed border-white/12 px-3 py-2.5 text-xs font-medium text-slate-500 hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
      >
        + Add project
      </button>
    </div>
  );

  /* ── Notice banner ─────────────────────────────────────────────────────── */
  const noticeBanner = notice ? (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${
      noticeKind === 'error'
        ? 'border-rose-500/20 bg-rose-500/8 text-rose-300'
        : noticeKind === 'ok'
        ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
        : 'border-white/8 bg-white/[0.03] text-slate-300'
    }`}>
      <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
        noticeKind === 'error' ? 'bg-rose-400' : noticeKind === 'ok' ? 'bg-emerald-400' : 'bg-slate-400'
      }`} />
      <span>{notice}</span>
      <button type="button" onClick={() => setNotice('')} className="ml-auto shrink-0 text-slate-500 hover:text-white">✕</button>
    </div>
  ) : null;

  return (
    <>
    {/* ── AI generating overlay ── */}
    {showAiOverlay && (
      <>
        <AppLoadingScreen message="AI is rebuilding your portfolio\u2026" />
        <button
          type="button"
          onClick={() => setShowAiOverlay(false)}
          className="fixed bottom-8 left-1/2 z-[1002] -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-slate-400 backdrop-blur-sm hover:bg-white/10 hover:text-white transition-colors"
        >
          Continue editing in background
        </button>
      </>
    )}

    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => router.push(`/portfolios/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
          ← Portfolio
        </button>
        <div className="flex items-center gap-2">
          {publishUrl && (
            <a href={publishUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/12 transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
          <button type="button" onClick={() => router.push(`/analytics/${id}`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </button>
          <button type="button" onClick={() => router.push(`/preview/${id}`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1ECEFA] px-3 py-1.5 text-xs font-semibold text-[#0C0F13] hover:bg-white transition-colors">
            <Globe className="h-3.5 w-3.5" /> Preview & Publish
          </button>
        </div>
      </div>

      {/* ── Title ── */}
      <div>
        <h1 className="text-xl font-bold text-white truncate">{title || 'Edit Portfolio'}</h1>
        <p className="mt-0.5 text-sm text-slate-500">Edit content, run AI optimizations, and publish.</p>
      </div>

      {/* ── Banners ── */}
      {noticeBanner}
      {(generatingStatus === 'processing' || generatingStatus === 'queued') && (
        <div className="flex items-center gap-3 rounded-xl border border-[#1ECEFA]/20 bg-[#1ECEFA]/8 px-4 py-3">
          <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#1ECEFA] border-t-transparent animate-spin" />
          <p className="text-xs text-[#8CEBFF]">AI is generating updates — this page refreshes automatically.</p>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_288px]">

        {/* ── Main column ── */}
        <div className="min-w-0 space-y-4">

          {/* Step pills */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((item) => (
              <button key={item.id} type="button" onClick={() => setStep(item.id)}
                className={`inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  step === item.id ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <span className="mr-1.5 text-xs opacity-50">{item.id}.</span>{item.label}
              </button>
            ))}
            <div className="ml-auto h-px flex-1 rounded-full bg-white/5 max-w-[80px]">
              <div className="h-px rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }} />
            </div>
          </div>

          {/* Step content panel */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-5">

            {/* ── Step 1: Basics ── */}
            {step === 1 && (
              <>
                <label className="block space-y-1.5">
                  <FieldLabel>Portfolio title</FieldLabel>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My Design Portfolio"
                    className={INPUT_CLS} />
                </label>

                <div className="space-y-2">
                  <FieldLabel>Template</FieldLabel>
                  <TemplatePicker
                    value={content.templateId}
                    onChange={(id) => setContent((prev) => ({ ...prev, templateId: normalizePortfolioTemplateId(id) }))}
                    columns={2}
                  />
                </div>

                <label className="block space-y-1.5">
                  <FieldLabel hint="(optional — helps AI tailor content)">Focus prompt</FieldLabel>
                  <input value={content.focusQuestion}
                    onChange={(e) => setContent((prev) => ({ ...prev, focusQuestion: e.target.value }))}
                    placeholder="e.g. Frontend engineer seeking roles in fintech"
                    className={INPUT_CLS} />
                </label>

                <SectionDivider label="Hero" />

                <label className="block space-y-1.5">
                  <FieldLabel>Headline</FieldLabel>
                  <input value={content.heroHeading}
                    onChange={(e) => setContent((prev) => ({ ...prev, heroHeading: e.target.value }))}
                    placeholder="e.g. Product Designer & Creative Technologist"
                    className={INPUT_CLS} />
                </label>
                <label className="block space-y-1.5">
                  <FieldLabel>Subtitle</FieldLabel>
                  <textarea rows={3} value={content.heroBody}
                    onChange={(e) => setContent((prev) => ({ ...prev, heroBody: e.target.value }))}
                    placeholder="A short, compelling tagline or intro sentence."
                    className={TEXTAREA_CLS} />
                </label>
              </>
            )}

            {/* ── Step 2: Content ── */}
            {step === 2 && (
              <>
                <SectionDivider label="Profile" />

                {/* Profile image */}
                <div className="flex items-start gap-4">
                  <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
                    {content.profileImageUrl ? (
                      <img src={content.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-slate-600">No image</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input value={content.profileImageUrl}
                      onChange={(e) => setContent((prev) => ({ ...prev, profileImageUrl: e.target.value }))}
                      placeholder="Profile image URL"
                      className={INPUT_CLS} />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors">
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => void handleProfileImageUpload(e.target.files?.[0] ?? null)} />
                      Upload local image
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <FieldLabel>About</FieldLabel>
                    <textarea rows={4} value={content.about}
                      onChange={(e) => setContent((prev) => ({ ...prev, about: e.target.value }))}
                      placeholder="Who you are and what you do."
                      className={TEXTAREA_CLS} />
                  </label>
                  <label className="block space-y-1.5">
                    <FieldLabel>Contact</FieldLabel>
                    <textarea rows={4} value={content.contact}
                      onChange={(e) => setContent((prev) => ({ ...prev, contact: e.target.value }))}
                      placeholder="Email, LinkedIn, website..."
                      className={TEXTAREA_CLS} />
                  </label>
                </div>

                <SectionDivider label="Work experience" />
                {renderListEditor('experience', 'Format: Role | Company | Summary')}

                <SectionDivider label="Skills" />
                {renderListEditor('skills', 'One skill per entry')}

                <SectionDivider label="Projects" />
                {renderProjectEditor()}

                <SectionDivider label="Certifications" />
                {renderListEditor('certifications', 'Format: Title | Issuer | Date')}
              </>
            )}

            {/* ── Step 3: Publish ── */}
            {step === 3 && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Projects', value: projectsCount },
                    { label: 'Skills', value: skillsCount },
                    { label: 'Experience', value: experienceCount },
                    { label: 'Certifications', value: certificationsCount },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                      <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Completion checklist */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-300">Completeness</p>
                    <span className={`text-xs font-semibold ${completionPct >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>{completionPct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8">
                    <div className="h-1 rounded-full bg-[#1ECEFA] transition-all" style={{ width: `${completionPct}%` }} />
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {completionChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2.5">
                        <CheckCircle className={`h-4 w-4 shrink-0 ${check.ok ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span className={`text-sm ${check.ok ? 'text-slate-200' : 'text-slate-500'}`}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critique results */}
                {critique.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-300">Suggestions</p>
                    {critique.map((item) => (
                      <p key={item} className="flex items-start gap-2 text-xs text-amber-200/80">
                        <span className="mt-0.5 shrink-0 text-amber-400">•</span>{item}
                      </p>
                    ))}
                  </div>
                )}

                {/* Publish CTA */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-300">Go live</p>
                  <p className="text-xs text-slate-500">Set your subdomain, configure SEO, and publish your portfolio from the Publish view.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => router.push(`/preview/${id}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors">
                      <Sparkles className="h-4 w-4" /> Open Publish View
                    </button>
                    {publishUrl && (
                      <a href={publishUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/12 transition-colors">
                        <Globe className="h-4 w-4" /> {publishUrl} <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-3.5">
            <button type="button" disabled={step === 1}
              onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))}
              className="rounded-xl border border-white/8 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
              Previous
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void handleSave()} disabled={saving}
                className="rounded-xl border border-white/8 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : saveMsg || 'Save'}
              </button>
              {step < 3 ? (
                <button type="button" onClick={() => void handleNext()}
                  className="rounded-xl bg-[#1ECEFA] px-5 py-2 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors">
                  Next Step →
                </button>
              ) : (
                <button type="button" onClick={() => router.push(`/portfolios/${id}`)}
                  className="rounded-xl bg-[#1ECEFA] px-5 py-2 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors">
                  Done ✓
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">

          {/* Health score */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400">Health Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black leading-none ${scoreLabel}`}>{healthScore}</span>
              <span className="pb-0.5 text-xs text-slate-600">/ 100</span>
            </div>
            <div className="h-1 rounded-full bg-white/8">
              <div className="h-1 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(healthScore, 100))}%`, backgroundColor: scoreColor }} />
            </div>
            <button type="button" onClick={() => void handleCritique()} disabled={critiquing}
              className="w-full rounded-xl border border-white/8 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {critiquing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>

          {/* AI panel */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#1ECEFA]" />
              <p className="text-xs font-semibold text-slate-400">AI Assistant</p>
            </div>
            {(generatingStatus === 'processing' || generatingStatus === 'queued') && (
              <div className="flex items-center gap-2 rounded-lg border border-[#1ECEFA]/20 bg-[#1ECEFA]/8 px-3 py-2">
                <div className="h-3 w-3 rounded-full border-2 border-[#1ECEFA] border-t-transparent animate-spin shrink-0" />
                <p className="text-[11px] text-[#8CEBFF]">Generating new version\u2026</p>
              </div>
            )}
            <button type="button" onClick={() => void handleGenerate()} disabled={generating}
              className="w-full rounded-xl bg-[#1ECEFA]/10 border border-[#1ECEFA]/20 px-3 py-2.5 text-xs font-semibold text-[#1ECEFA] hover:bg-[#1ECEFA]/15 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              {generating ? 'Queuing...' : 'Regenerate with AI'}
            </button>
            <p className="text-[11px] text-slate-600 text-center">AI rewrites your portfolio content based on your focus prompt.</p>
          </div>

          {/* Versions */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-400">Versions</p>
              </div>
              <button type="button" onClick={() => void handleSaveVersion()}
                className="inline-flex items-center gap-1 rounded-lg border border-white/8 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                <PlusCircle className="h-3 w-3" /> Save
              </button>
            </div>
            {versions.length === 0 ? (
              <p className="text-[11px] text-slate-600">No versions saved yet.</p>
            ) : (
              <div className="space-y-1.5">
                {versions.slice(0, 5).map((version) => (
                  <div key={version.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-slate-300">{version.label}</p>
                      <p className="text-[10px] text-slate-600">{new Date(version.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button type="button" onClick={() => void handleRestoreVersion(version.id)}
                      title="Restore this version"
                      className="shrink-0 rounded-md border border-white/8 p-1.5 text-slate-500 hover:bg-white/5 hover:text-white transition-colors">
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
