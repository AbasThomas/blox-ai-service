'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, scannerApi } from '@/lib/api';

type SectionKey = 'hero' | 'about' | 'experience' | 'projects' | 'skills' | 'contact';

interface SectionData {
  heading?: string;
  body?: string;
  items?: string[];
}

type ContentMap = Record<SectionKey, SectionData>;

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero / Header',
  about: 'About Me',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  contact: 'Contact',
};

const DEFAULT_CONTENT: ContentMap = {
  hero: { heading: '', body: '' },
  about: { body: '' },
  experience: { items: [] },
  projects: { items: [] },
  skills: { items: [] },
  contact: { body: '' },
};

interface Version {
  id: string;
  label: string;
  createdAt: string;
}

export default function PortfolioEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ContentMap>(DEFAULT_CONTENT);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [critiquing, setCritiquing] = useState(false);
  const [critique, setCritique] = useState<string[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [generatingStatus, setGeneratingStatus] = useState('');

  const loadAsset = useCallback(async () => {
    try {
      const asset = await assetsApi.getById(params.id) as {
        title: string;
        content: ContentMap;
        healthScore: number;
        publishedUrl?: string;
        generatingStatus?: string;
      };
      setTitle(asset.title);
      setContent({ ...DEFAULT_CONTENT, ...asset.content });
      setHealthScore(asset.healthScore ?? 0);
      setPublishUrl(asset.publishedUrl ?? '');
      setGeneratingStatus(asset.generatingStatus ?? '');
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { loadAsset(); }, [loadAsset]);

  // Poll if generating
  useEffect(() => {
    if (generatingStatus !== 'processing' && generatingStatus !== 'queued') return;
    const timer = setInterval(loadAsset, 5000);
    return () => clearInterval(timer);
  }, [generatingStatus, loadAsset]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await assetsApi.update(params.id, { title, content });
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await assetsApi.generate(params.id);
      setGeneratingStatus('queued');
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  };

  const handleCritique = async () => {
    setCritiquing(true);
    setCritique([]);
    try {
      const res = await scannerApi.atsScore({ assetId: params.id }) as {
        score: number; checks: Array<{ label: string; passed: boolean; suggestion?: string }>;
      };
      setHealthScore(res.score);
      setCritique(res.checks.filter((c) => !c.passed && c.suggestion).map((c) => c.suggestion!));
    } catch { /* ignore */ }
    finally { setCritiquing(false); }
  };

  const handleSaveVersion = async () => {
    try {
      const label = `v${new Date().toLocaleString()}`;
      await assetsApi.saveVersion(params.id, { label, content });
      setVersions((prev) => [{ id: Date.now().toString(), label, createdAt: new Date().toISOString() }, ...prev]);
    } catch { /* ignore */ }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await assetsApi.restoreVersion(params.id, versionId);
      await loadAsset();
      setShowVersions(false);
    } catch { /* ignore */ }
  };

  const updateSection = (key: SectionKey, patch: Partial<SectionData>) => {
    setContent((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const updateItem = (key: SectionKey, index: number, value: string) => {
    const items = [...(content[key].items ?? [])];
    items[index] = value;
    updateSection(key, { items });
  };

  const addItem = (key: SectionKey) => updateSection(key, { items: [...(content[key].items ?? []), ''] });
  const removeItem = (key: SectionKey, index: number) => {
    const items = (content[key].items ?? []).filter((_, i) => i !== index);
    updateSection(key, { items });
  };

  const scoreColor = healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <FeaturePage title={title || 'Portfolio editor'} description="Edit your sections, apply AI improvements, and publish.">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Title bar */}
          <div className="flex items-center gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Portfolio title" />
            <button onClick={handleSave} disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? 'Saving...' : saveMsg || 'Save'}
            </button>
          </div>

          {generatingStatus === 'processing' || generatingStatus === 'queued' ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
              <p className="text-sm text-blue-800">AI is generating your content... refreshing automatically.</p>
            </div>
          ) : null}

          {/* Section tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <button key={key} onClick={() => setActiveSection(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeSection === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {SECTION_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Section editor */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-h-[240px]">
            <h3 className="text-sm font-bold text-slate-900 mb-4">{SECTION_LABELS[activeSection]}</h3>

            {(activeSection === 'hero' || activeSection === 'about' || activeSection === 'contact') && (
              <div className="space-y-3">
                {activeSection === 'hero' && (
                  <input value={content.hero.heading ?? ''} onChange={(e) => updateSection('hero', { heading: e.target.value })}
                    placeholder="Your name / headline"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                )}
                <textarea rows={6}
                  value={content[activeSection].body ?? ''}
                  onChange={(e) => updateSection(activeSection, { body: e.target.value })}
                  placeholder={activeSection === 'hero' ? 'Tagline or intro paragraph' :
                    activeSection === 'about' ? 'About me description' : 'Contact information, social links, email'}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            )}

            {(activeSection === 'experience' || activeSection === 'projects' || activeSection === 'skills') && (
              <div className="space-y-2">
                {(content[activeSection].items ?? []).map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea rows={2} value={item} onChange={(e) => updateItem(activeSection, i, e.target.value)}
                      placeholder={activeSection === 'skills' ? 'Skill (e.g. React, Python)' :
                        activeSection === 'projects' ? 'Project name, description, URL' :
                        'Role at Company (Dates) — achievements'}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <button onClick={() => removeItem(activeSection, i)}
                      className="text-red-400 hover:text-red-600 px-1 text-lg leading-none">×</button>
                  </div>
                ))}
                <button onClick={() => addItem(activeSection)}
                  className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-slate-400 w-full">
                  + Add {activeSection === 'skills' ? 'skill' : activeSection === 'projects' ? 'project' : 'position'}
                </button>
              </div>
            )}
          </div>

          {/* Preview link */}
          {publishUrl && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center justify-between">
              <p className="text-sm text-green-800">Published at <span className="font-mono">{publishUrl}</span></p>
              <a href={`/preview/${params.id}`} className="text-xs font-bold text-green-700 hover:underline">Preview →</a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Health score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <p className={`text-4xl font-black ${scoreColor}`}>{healthScore}</p>
            <p className="text-xs text-slate-500 mt-0.5">Health score</p>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${healthScore}%` }} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button onClick={handleGenerate} disabled={generating}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {generating ? 'Queuing...' : 'Re-generate with AI'}
            </button>
            <button onClick={handleCritique} disabled={critiquing}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {critiquing ? 'Analysing...' : 'Run critique'}
            </button>
            <button onClick={handleSaveVersion}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Save version
            </button>
            <button onClick={() => router.push(`/preview/${params.id}`)}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Preview &amp; publish
            </button>
          </div>

          {/* Critique results */}
          {critique.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-xs font-bold text-amber-900 mb-2">Improvements</h3>
              <ul className="space-y-1">
                {critique.map((c, i) => (
                  <li key={i} className="text-xs text-amber-800 flex gap-1.5">
                    <span className="text-amber-500 shrink-0">→</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Versions */}
          {versions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <button onClick={() => setShowVersions((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-900">
                Versions ({versions.length})
                <span className="text-slate-400">{showVersions ? '▲' : '▼'}</span>
              </button>
              {showVersions && (
                <div className="mt-3 space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">{v.label}</span>
                      <button onClick={() => handleRestoreVersion(v.id)}
                        className="ml-2 shrink-0 text-blue-600 hover:underline">Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </FeaturePage>
  );
}
