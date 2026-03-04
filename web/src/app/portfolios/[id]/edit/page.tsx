'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, scannerApi } from '@/lib/api';

type SectionKey =
  | 'hero'
  | 'about'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'contact';

type ContentRecord = Record<string, unknown>;

interface EditorContent {
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

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero',
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  contact: 'Contact',
};

const EMPTY_EDITOR_CONTENT: EditorContent = {
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

function extractItemList(
  source: unknown,
  kind: 'generic' | 'projects' | 'certifications',
) {
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

  return {
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

function buildUpdatedContent(
  previous: ContentRecord,
  editor: EditorContent,
): ContentRecord {
  const next = { ...previous };
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

export default function PortfolioEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [rawContent, setRawContent] = useState<ContentRecord>({});
  const [content, setContent] = useState<EditorContent>(EMPTY_EDITOR_CONTENT);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [critiquing, setCritiquing] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [showVersions, setShowVersions] = useState(false);
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
      setHealthScore(
        typeof asset.healthScore === 'number' ? asset.healthScore : 0,
      );
      setPublishUrl(asset.publishedUrl ?? '');
      setGeneratingStatus(asString(assetContent.generatingStatus));
    } catch {
      setNotice('Could not load portfolio data.');
    }
  }, [params.id]);

  const loadVersions = useCallback(async () => {
    try {
      const rows = (await assetsApi.listVersions(params.id)) as Array<
        Record<string, unknown>
      >;
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

  const handleSave = async () => {
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
      setTimeout(() => setSaveMsg(''), 1800);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setNotice('');
    try {
      await assetsApi.generate(params.id);
      setGeneratingStatus('queued');
      setNotice('AI regeneration queued.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'AI generation failed.',
      );
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
          .filter(
            (check) => !check.passed && typeof check.suggestion === 'string',
          )
          .map((check) => check.suggestion as string),
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Critique request failed.',
      );
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
      setNotice(
        error instanceof Error ? error.message : 'Could not save version.',
      );
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await assetsApi.restoreVersion(params.id, versionId);
      await loadAsset();
      await loadVersions();
      setShowVersions(false);
      setNotice('Version restored.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not restore version.',
      );
    }
  };

  const updateListItem = (
    key: 'experience' | 'projects' | 'skills' | 'certifications',
    index: number,
    value: string,
  ) => {
    setContent((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };

  const addListItem = (
    key: 'experience' | 'projects' | 'skills' | 'certifications',
  ) => {
    setContent((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (
    key: 'experience' | 'projects' | 'skills' | 'certifications',
    index: number,
  ) => {
    setContent((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index),
    }));
  };

  const scoreClass = useMemo(() => {
    if (healthScore >= 70) return 'text-emerald-300';
    if (healthScore >= 40) return 'text-amber-300';
    return 'text-rose-300';
  }, [healthScore]);

  const listHint = useMemo(() => {
    if (activeSection === 'projects') {
      return 'Use format: Title | Description | URL';
    }
    if (activeSection === 'certifications') {
      return 'Use format: Title | Issuer | Date';
    }
    return '';
  }, [activeSection]);

  const renderListEditor = (
    key: 'experience' | 'projects' | 'skills' | 'certifications',
  ) => {
    const items = content[key];
    return (
      <div className="space-y-2">
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
              onChange={(event) =>
                updateListItem(key, index, event.target.value)
              }
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
      title={title || 'Portfolio Editor'}
      description="Edit AI output, run checks, and publish from one place."
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 overflow-x-hidden">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#0C1118] p-3">
          <button
            type="button"
            onClick={() => router.push('/portfolios')}
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => router.push(`/analytics/${params.id}`)}
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => router.push(`/preview/${params.id}`)}
            className="rounded-md border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs font-semibold text-[#1ECEFA]"
          >
            Preview & Publish
          </button>
          <div className="ml-auto min-w-[220px] flex-1">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
              placeholder="Portfolio title"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-md bg-[#1ECEFA] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
          >
            {saving ? 'Saving...' : saveMsg || 'Save'}
          </button>
        </div>

        {notice ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            {notice}
          </div>
        ) : null}

        {(generatingStatus === 'processing' ||
          generatingStatus === 'queued') && (
          <div className="rounded-lg border border-[#1ECEFA]/25 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#8CEBFF]">
            AI is generating updates. This page refreshes automatically.
          </div>
        )}

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#0C1118] p-3">
              {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    activeSection === key
                      ? 'bg-[#1ECEFA] text-black'
                      : 'border border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {SECTION_LABELS[key]}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                {SECTION_LABELS[activeSection]}
              </h2>
              {listHint ? (
                <p className="mt-1 text-xs text-slate-400">{listHint}</p>
              ) : null}

              <div className="mt-3">
                {activeSection === 'hero' && (
                  <div className="space-y-3">
                    <input
                      value={content.heroHeading}
                      onChange={(event) =>
                        setContent((prev) => ({
                          ...prev,
                          heroHeading: event.target.value,
                        }))
                      }
                      placeholder="Name or hero title"
                      className="w-full rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                    />
                    <textarea
                      rows={6}
                      value={content.heroBody}
                      onChange={(event) =>
                        setContent((prev) => ({
                          ...prev,
                          heroBody: event.target.value,
                        }))
                      }
                      placeholder="Hero subtitle or intro text"
                      className="w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                    />
                  </div>
                )}

                {activeSection === 'about' && (
                  <textarea
                    rows={10}
                    value={content.about}
                    onChange={(event) =>
                      setContent((prev) => ({
                        ...prev,
                        about: event.target.value,
                      }))
                    }
                    placeholder="About text"
                    className="w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                )}

                {activeSection === 'contact' && (
                  <textarea
                    rows={6}
                    value={content.contact}
                    onChange={(event) =>
                      setContent((prev) => ({
                        ...prev,
                        contact: event.target.value,
                      }))
                    }
                    placeholder="Email, socials, and contact text"
                    className="w-full resize-y rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                  />
                )}

                {activeSection === 'experience' &&
                  renderListEditor('experience')}
                {activeSection === 'projects' && renderListEditor('projects')}
                {activeSection === 'skills' && renderListEditor('skills')}
                {activeSection === 'certifications' &&
                  renderListEditor('certifications')}
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <p className={`text-3xl ${scoreClass}`}>{healthScore}</p>
              <p className="text-xs text-slate-400">Health score</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-[#1ECEFA]"
                  style={{
                    width: `${Math.max(0, Math.min(healthScore, 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <h3 className="text-sm font-semibold text-slate-100">Actions</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={generating}
                  className="w-full rounded-md bg-[#1ECEFA] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
                >
                  {generating ? 'Queued...' : 'Re-generate with AI'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCritique()}
                  disabled={critiquing}
                  className="w-full rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
                >
                  {critiquing ? 'Running...' : 'Run critique'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveVersion()}
                  className="w-full rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
                >
                  Save version
                </button>
              </div>
            </div>

            {publishUrl ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-200">Published URL</p>
                <a
                  href={publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-xs font-semibold text-emerald-100 hover:underline"
                >
                  {publishUrl}
                </a>
              </div>
            ) : null}

            {critique.length > 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <h3 className="text-sm font-semibold text-amber-100">
                  Suggested fixes
                </h3>
                <div className="mt-2 space-y-2">
                  {critique.map((item) => (
                    <p key={item} className="text-xs text-amber-100">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {versions.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
                <button
                  type="button"
                  onClick={() => setShowVersions((value) => !value)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-100"
                >
                  <span>Versions ({versions.length})</span>
                  <span>{showVersions ? 'Hide' : 'Show'}</span>
                </button>
                {showVersions ? (
                  <div className="mt-3 space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-white/10 px-2 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs text-slate-200">
                            {version.label}
                          </p>
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
          </aside>
        </div>
      </div>
    </FeaturePage>
  );
}
