'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, scannerApi } from '@/lib/api';
import {
  DEFAULT_PORTFOLIO_TEMPLATE_ID,
  PORTFOLIO_TEMPLATE_OPTIONS,
  normalizePortfolioTemplateId,
} from '@/lib/portfolio-templates';
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle,
  Clock,
  Globe,
  PlusCircle,
  Sparkles,
  Zap,
} from '@/components/ui/icons';

type Step = 1 | 2 | 3 | 4 | 5;
type ContentTab = 'profile' | 'projects' | 'certifications';
type ContentRecord = Record<string, unknown>;

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

const STEPS: Array<{ id: Step; label: string; description: string }> = [
  { id: 1, label: 'Quick Start', description: 'Set direction and template.' },
  { id: 2, label: 'Content Hub', description: 'Edit profile, projects, and certifications.' },
  { id: 3, label: 'AI Optimize', description: 'Regenerate and run critique.' },
  { id: 4, label: 'Review', description: 'Check quality and versions.' },
  { id: 5, label: 'Publish', description: 'Open publish and sharing tools.' },
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
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function stringifyProjectItem(item: unknown): string {
  if (typeof item === 'string') return item;
  const row = asRecord(item);
  const title = asString(row.title) || asString(row.name);
  const description = asString(row.description);
  const url = asString(row.url);
  return [title, description, url].filter(Boolean).join(' | ');
}

function stringifyCertificationItem(item: unknown): string {
  if (typeof item === 'string') return item;
  const row = asRecord(item);
  const title = asString(row.title) || asString(row.name);
  const issuer = asString(row.issuer);
  const date = asString(row.date) || asString(row.completedAt);
  return [title, issuer, date].filter(Boolean).join(' | ');
}

function stringifyGenericItem(item: unknown): string {
  if (typeof item === 'string') return item;
  const row = asRecord(item);
  const values = Object.values(row)
    .map((value) => asString(value).trim())
    .filter(Boolean);
  return values.join(' | ');
}

function extractItemList(source: unknown, kind: 'generic' | 'projects' | 'certifications') {
  const record = asRecord(source);
  const rawItems = asArray(record.items);
  const items = rawItems.length > 0 ? rawItems : asArray(source);
  const parser =
    kind === 'projects'
      ? stringifyProjectItem
      : kind === 'certifications'
        ? stringifyCertificationItem
        : stringifyGenericItem;
  return items
    .map(parser)
    .map((item) => item.trim())
    .filter(Boolean);
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

function parseProjectLine(line: string) {
  const parts = line
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const title = parts[0] ?? 'Project';
  const description = parts[1] ?? '';
  const url = parts[2] ?? '';
  return {
    title,
    name: title,
    description,
    ...(url ? { url } : {}),
  };
}

function parseCertificationLine(line: string) {
  const parts = line
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return {
    title: parts[0] ?? 'Certification',
    ...(parts[1] ? { issuer: parts[1] } : {}),
    ...(parts[2] ? { date: parts[2], completedAt: parts[2] } : {}),
  };
}

function buildUpdatedContent(previous: ContentRecord, editor: EditorContent): ContentRecord {
  const next = { ...previous };
  next.templateId = normalizePortfolioTemplateId(editor.templateId);
  next.meta = {
    ...asRecord(previous.meta),
    focusQuestion: editor.focusQuestion.trim(),
  };
  next.profile = {
    ...asRecord(previous.profile),
    avatarUrl: editor.profileImageUrl.trim(),
  };
  next.hero = {
    ...asRecord(previous.hero),
    heading: editor.heroHeading.trim(),
    body: editor.heroBody.trim(),
  };
  next.about = {
    ...asRecord(previous.about),
    body: editor.about.trim(),
  };
  next.contact = {
    ...asRecord(previous.contact),
    body: editor.contact.trim(),
  };
  next.experience = {
    items: editor.experience.map((item) => item.trim()).filter(Boolean),
  };
  next.projects = {
    items: editor.projects
      .map((item) => item.trim())
      .filter(Boolean)
      .map(parseProjectLine),
  };
  next.skills = {
    items: editor.skills.map((item) => item.trim()).filter(Boolean),
  };
  next.certifications = {
    items: editor.certifications
      .map((item) => item.trim())
      .filter(Boolean)
      .map(parseCertificationLine),
  };
  return next;
}

function formatVersionLabel(raw: Record<string, unknown>) {
  return (
    asString(raw.versionLabel) ||
    asString(raw.label) ||
    `Version ${new Date(asString(raw.createdAt) || Date.now()).toLocaleString()}`
  );
}

export default function PortfolioEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [activeTab, setActiveTab] = useState<ContentTab>('profile');
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

  const loadAsset = useCallback(async () => {
    try {
      const asset = (await assetsApi.getById(params.id)) as AssetResponse;
      const assetContent = asRecord(asset.content);
      setTitle(asset.title || '');
      setRawContent(assetContent);
      setContent(normalizeContent(assetContent));
      setHealthScore(typeof asset.healthScore === 'number' ? asset.healthScore : 0);
      setPublishUrl(asset.publishedUrl ?? '');
      setGeneratingStatus(asString(asset.generatingStatus) || asString(assetContent.generatingStatus));
    } catch {
      setNotice('Could not load portfolio data.');
    }
  }, [params.id]);

  const loadVersions = useCallback(async () => {
    try {
      const rows = (await assetsApi.listVersions(params.id)) as Array<Record<string, unknown>>;
      setVersions(
        rows.map((row) => ({
          id: asString(row.id),
          label: formatVersionLabel(row),
          createdAt: asString(row.createdAt) || new Date().toISOString(),
        })),
      );
    } catch {
      setVersions([]);
    }
  }, [params.id]);

  useEffect(() => {
    void loadAsset();
    void loadVersions();
  }, [loadAsset, loadVersions]);

  useEffect(() => {
    if (generatingStatus !== 'processing' && generatingStatus !== 'queued') {
      return;
    }
    const timer = setInterval(() => {
      void loadAsset();
    }, 4000);
    return () => clearInterval(timer);
  }, [generatingStatus, loadAsset]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg('');
    setNotice('');
    try {
      const updatedContent = buildUpdatedContent(rawContent, content);
      await assetsApi.update(params.id, {
        title: title.trim(),
        content: updatedContent,
      });
      setRawContent(updatedContent);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 1600);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Save failed.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [content, params.id, rawContent, title]);

  const handleGenerate = async () => {
    setGenerating(true);
    setNotice('');
    try {
      await assetsApi.generate(params.id);
      setGeneratingStatus('queued');
      setNotice('AI regeneration queued.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCritique = async () => {
    setCritiquing(true);
    setNotice('');
    setCritique([]);
    try {
      const res = (await scannerApi.atsScore({ assetId: params.id })) as {
        score: number;
        checks: Array<{ label: string; passed: boolean; suggestion?: string }>;
      };
      setHealthScore(typeof res.score === 'number' ? res.score : 0);
      setCritique(
        (res.checks ?? [])
          .filter((check) => !check.passed && typeof check.suggestion === 'string')
          .map((check) => check.suggestion as string),
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Critique request failed.');
    } finally {
      setCritiquing(false);
    }
  };

  const handleSaveVersion = async () => {
    try {
      const label = `v${new Date().toLocaleString()}`;
      await assetsApi.saveVersion(params.id, { label, branch: 'main' });
      await loadVersions();
      setNotice('Version saved.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save version.');
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await assetsApi.restoreVersion(params.id, versionId);
      await loadAsset();
      await loadVersions();
      setNotice('Version restored.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not restore version.');
    }
  };

  const handleProfileImageUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) return;
      setContent((prev) => ({ ...prev, profileImageUrl: dataUrl }));
      setNotice('Profile image added. Save to persist it.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import profile image.');
    }
  };

  const updateListItem = (key: 'experience' | 'projects' | 'skills' | 'certifications', index: number, value: string) => {
    setContent((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };

  const addListItem = (key: 'experience' | 'projects' | 'skills' | 'certifications') => {
    setContent((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (key: 'experience' | 'projects' | 'skills' | 'certifications', index: number) => {
    setContent((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index),
    }));
  };

  const handleNext = async () => {
    const shouldSave = step === 1 || step === 2 || step === 4;
    if (shouldSave) {
      const ok = await handleSave();
      if (!ok) return;
    }
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));
  };

  const scoreClass = useMemo(() => {
    if (healthScore >= 70) return 'text-emerald-300';
    if (healthScore >= 40) return 'text-amber-300';
    return 'text-rose-300';
  }, [healthScore]);

  const progressPercent = useMemo(() => ((step - 1) / (STEPS.length - 1)) * 100, [step]);

  const projectsCount = content.projects.filter((item) => item.trim()).length;
  const certificationsCount = content.certifications.filter((item) => item.trim()).length;
  const skillsCount = content.skills.filter((item) => item.trim()).length;

  const completionChecks = [
    { label: 'Hero details added', ok: !!content.heroHeading.trim() && !!content.heroBody.trim() },
    { label: 'At least one project', ok: projectsCount > 0 },
    { label: 'At least three skills', ok: skillsCount >= 3 },
    { label: 'Contact section added', ok: !!content.contact.trim() },
  ];

  const renderListEditor = (key: 'experience' | 'projects' | 'skills' | 'certifications', hint?: string) => {
    const items = content[key];
    return (
      <div className="space-y-2">
        {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
        {items.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
            No items yet.
          </p>
        ) : null}
        {items.map((item, index) => (
          <div key={`${key}-${index}`} className="flex items-start gap-2">
            <textarea
              rows={key === 'skills' ? 1 : 2}
              value={item}
              onChange={(event) => updateListItem(key, index, event.target.value)}
              className="min-w-0 flex-1 resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
            />
            <button
              type="button"
              onClick={() => removeListItem(key, index)}
              className="rounded-md border border-white/10 px-2 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addListItem(key)}
          className="w-full rounded-md border border-dashed border-white/20 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#1ECEFA]/40 hover:text-[#1ECEFA]"
        >
          Add item
        </button>
      </div>
    );
  };

  return (
    <FeaturePage
      title={title || 'Edit Portfolio'}
      description="Edit content, run AI optimizations, preview, and publish."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5 overflow-x-hidden">
        {/* Top action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#0d0d16] px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/portfolios')}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              ← All Portfolios
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/analytics/${params.id}`)}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => router.push(`/preview/${params.id}`)}
              className="rounded-xl bg-[#1ECEFA] px-3 py-1.5 text-xs font-semibold text-[#0C0F13] hover:bg-white transition-colors"
            >
              Preview & Publish
            </button>
          </div>
        </div>

        {/* Step navigator */}
        <div className="rounded-2xl border border-white/5 bg-[#0d0d16] p-4">
          {/* Progress bar */}
          <div className="mb-4 h-1 w-full rounded-full bg-white/5">
            <div
              className="h-1 rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Step tabs */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {STEPS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={`inline-flex shrink-0 flex-col items-start rounded-full px-4 py-2 transition-all ${
                  step === item.id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {notice ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            {notice}
          </div>
        ) : null}

        {(generatingStatus === 'processing' || generatingStatus === 'queued') ? (
          <div className="rounded-lg border border-[#1ECEFA]/25 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#8CEBFF]">
            AI is generating updates. This page refreshes automatically.
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/5 bg-[#0C0F13] p-5">
          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">Quick Start</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-xs text-slate-400">
                  Portfolio title
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Template
                  <select
                    value={content.templateId}
                    onChange={(event) =>
                      setContent((prev) => ({
                        ...prev,
                        templateId: normalizePortfolioTemplateId(event.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  >
                    {PORTFOLIO_TEMPLATE_OPTIONS.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs text-slate-400">
                Focus prompt (optional)
                <input
                  value={content.focusQuestion}
                  onChange={(event) => setContent((prev) => ({ ...prev, focusQuestion: event.target.value }))}
                  placeholder="Example: Frontend role in Lagos fintech"
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                />
              </label>
              <label className="block text-xs text-slate-400">
                Hero title
                <input
                  value={content.heroHeading}
                  onChange={(event) => setContent((prev) => ({ ...prev, heroHeading: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(['profile', 'projects', 'certifications'] as ContentTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'profile' ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                    <div className="h-[120px] w-[120px] overflow-hidden rounded-lg border border-white/10 bg-[#0E141D]">
                      {content.profileImageUrl ? (
                        <img src={content.profileImageUrl} alt="Profile preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-slate-500">
                          No profile image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        value={content.profileImageUrl}
                        onChange={(event) => setContent((prev) => ({ ...prev, profileImageUrl: event.target.value }))}
                        placeholder="Profile image URL"
                        className="w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                      />
                      <label className="inline-flex cursor-pointer items-center rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => void handleProfileImageUpload(event.target.files?.[0] ?? null)}
                        />
                        Upload local image
                      </label>
                    </div>
                  </div>

                  <label className="block text-xs text-slate-400">
                    Hero subtitle
                    <textarea
                      rows={4}
                      value={content.heroBody}
                      onChange={(event) => setContent((prev) => ({ ...prev, heroBody: event.target.value }))}
                      className="mt-1 w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                    />
                  </label>
                  <label className="block text-xs text-slate-400">
                    About
                    <textarea
                      rows={5}
                      value={content.about}
                      onChange={(event) => setContent((prev) => ({ ...prev, about: event.target.value }))}
                      className="mt-1 w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                    />
                  </label>
                  <label className="block text-xs text-slate-400">
                    Contact
                    <textarea
                      rows={3}
                      value={content.contact}
                      onChange={(event) => setContent((prev) => ({ ...prev, contact: event.target.value }))}
                      className="mt-1 w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                    />
                  </label>
                  {renderListEditor('experience', 'Experience entries (Role | Company | Summary optional).')}
                  {renderListEditor('skills', 'Add one skill per line.')}
                </div>
              ) : null}

              {activeTab === 'projects' ? renderListEditor('projects', 'Format: Title | Description | URL') : null}
              {activeTab === 'certifications' ? renderListEditor('certifications', 'Format: Title | Issuer | Date') : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">AI Optimization</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1ECEFA] px-3 py-2 text-sm font-semibold text-black disabled:opacity-60"
                >
                  <Bot className="h-4 w-4" />
                  {generating ? 'Queued...' : 'Regenerate with AI'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCritique()}
                  disabled={critiquing}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
                >
                  <Zap className="h-4 w-4" />
                  {critiquing ? 'Running...' : 'Run Critique'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveVersion()}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  <PlusCircle className="h-4 w-4" />
                  Save Version
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className={`text-3xl ${scoreClass}`}>{healthScore}</p>
                <p className="text-xs text-slate-400">Health score</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-[#1ECEFA]"
                    style={{ width: `${Math.max(0, Math.min(healthScore, 100))}%` }}
                  />
                </div>
              </div>

              {critique.length > 0 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <h3 className="text-sm font-semibold text-amber-100">Suggested fixes</h3>
                  <div className="mt-2 space-y-2">
                    {critique.map((item) => (
                      <p key={item} className="text-xs text-amber-100">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">Review & Finalize</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Projects</p>
                  <p className="text-xl font-semibold text-slate-100">{projectsCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Skills</p>
                  <p className="text-xl font-semibold text-slate-100">{skillsCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Certifications</p>
                  <p className="text-xl font-semibold text-slate-100">{certificationsCount}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                {completionChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 ${check.ok ? 'text-emerald-300' : 'text-slate-500'}`} />
                    <span className={check.ok ? 'text-slate-200' : 'text-slate-400'}>{check.label}</span>
                  </div>
                ))}
              </div>

              {versions.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                  <h3 className="text-sm font-semibold text-slate-100">Saved versions</h3>
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-200">{version.label}</p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestoreVersion(version.id)}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/5"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">Publish & Share</h2>
              <p className="text-sm text-slate-400">
                Open the publish view to set subdomain, save SEO, and go live.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => router.push(`/preview/${params.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1ECEFA] px-3 py-2 text-sm font-semibold text-black"
                >
                  <Sparkles className="h-4 w-4" />
                  Open Publish View
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/analytics/${params.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  <BarChart3 className="h-4 w-4" />
                  Open Analytics
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/portfolios')}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Dashboard
                </button>
              </div>
              {publishUrl ? (
                <a
                  href={publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {publishUrl}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : (
                <p className="text-xs text-slate-400">
                  This portfolio is not live yet. Use the publish view to deploy.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/5 bg-[#0d0d16] px-4 py-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving...' : saveMsg || 'Save'}
            </button>
            {step < 5 ? (
              <button
                type="button"
                onClick={() => void handleNext()}
                className="rounded-xl bg-[#1ECEFA] px-5 py-2 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors"
              >
                {step === 4 ? 'Continue to Publish' : 'Next Step'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/portfolios')}
                className="rounded-xl bg-[#1ECEFA] px-5 py-2 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
