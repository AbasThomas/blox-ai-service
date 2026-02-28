'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, scannerApi } from '@/lib/api';

type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'certifications';

interface SectionData {
  body?: string;
  items?: string[];
}

type ContentMap = Record<SectionKey, SectionData>;

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
};

const DEFAULT_CONTENT: ContentMap = {
  summary: { body: '' },
  experience: { items: [] },
  education: { items: [] },
  skills: { items: [] },
  certifications: { items: [] },
};

export default function ResumeEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ContentMap>(DEFAULT_CONTENT);
  const [activeSection, setActiveSection] = useState<SectionKey>('summary');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsChecks, setAtsChecks] = useState<Array<{ label: string; passed: boolean; suggestion?: string }>>([]);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');

  const loadAsset = useCallback(async () => {
    try {
      const asset = await assetsApi.getById(params.id) as {
        title: string;
        content: ContentMap;
        healthScore: number;
        generatingStatus?: string;
      };
      setTitle(asset.title);
      setContent({ ...DEFAULT_CONTENT, ...asset.content });
      setGeneratingStatus(asset.generatingStatus ?? '');
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { loadAsset(); }, [loadAsset]);

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

  const handleAtsScore = async () => {
    setScanning(true);
    try {
      const res = await scannerApi.atsScore({ assetId: params.id }) as {
        score: number;
        checks: Array<{ label: string; passed: boolean; suggestion?: string }>;
      };
      setAtsScore(res.score);
      setAtsChecks(res.checks);
    } catch { /* ignore */ }
    finally { setScanning(false); }
  };

  const updateSection = (key: SectionKey, patch: Partial<SectionData>) =>
    setContent((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const updateItem = (key: SectionKey, index: number, value: string) => {
    const items = [...(content[key].items ?? [])];
    items[index] = value;
    updateSection(key, { items });
  };

  const addItem = (key: SectionKey) => updateSection(key, { items: [...(content[key].items ?? []), ''] });
  const removeItem = (key: SectionKey, index: number) =>
    updateSection(key, { items: (content[key].items ?? []).filter((_, i) => i !== index) });

  const atsColor = atsScore === null ? '' : atsScore >= 70 ? 'text-green-600' : atsScore >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <FeaturePage title={title || 'Resume builder'} description="Build an ATS-optimised resume with AI assistance.">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Editor */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Resume title" />
            <button onClick={handleSave} disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? 'Saving...' : saveMsg || 'Save'}
            </button>
          </div>

          {(generatingStatus === 'processing' || generatingStatus === 'queued') && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
              <p className="text-sm text-blue-800">AI is generating your resume...</p>
            </div>
          )}

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

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-h-[240px]">
            <h3 className="text-sm font-bold text-slate-900 mb-4">{SECTION_LABELS[activeSection]}</h3>

            {activeSection === 'summary' && (
              <textarea rows={6} value={content.summary.body ?? ''}
                onChange={(e) => updateSection('summary', { body: e.target.value })}
                placeholder="Write a compelling 2-3 sentence professional summary..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            )}

            {(activeSection === 'experience' || activeSection === 'education' || activeSection === 'skills' || activeSection === 'certifications') && (
              <div className="space-y-2">
                {(content[activeSection].items ?? []).map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea rows={activeSection === 'skills' ? 1 : 3} value={item}
                      onChange={(e) => updateItem(activeSection, i, e.target.value)}
                      placeholder={
                        activeSection === 'skills' ? 'Skill (e.g. TypeScript, Docker)' :
                        activeSection === 'certifications' ? 'Certification name, issuer, year' :
                        activeSection === 'education' ? 'Degree, Institution, Year' :
                        'Job title, Company (Start – End)\n• Achievement bullet 1\n• Achievement bullet 2'
                      }
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <button onClick={() => removeItem(activeSection, i)}
                      className="text-red-400 hover:text-red-600 px-1 text-lg leading-none">×</button>
                  </div>
                ))}
                <button onClick={() => addItem(activeSection)}
                  className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-slate-400 w-full">
                  + Add entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* ATS score panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {atsScore !== null ? (
              <div className="text-center mb-4">
                <p className={`text-4xl font-black ${atsColor}`}>{atsScore}</p>
                <p className="text-xs text-slate-500">ATS Score / 100</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${atsScore}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center mb-4">Run an ATS scan to see your score.</p>
            )}
            <button onClick={handleAtsScore} disabled={scanning}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {scanning ? 'Scanning...' : 'Run ATS scan'}
            </button>
          </div>

          {atsChecks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 mb-3">ATS checks</h3>
              <ul className="space-y-2">
                {atsChecks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={c.passed ? 'text-green-500' : 'text-red-500'}>{c.passed ? '✓' : '✗'}</span>
                    <div>
                      <span className={c.passed ? 'text-slate-700' : 'text-slate-900 font-medium'}>{c.label}</span>
                      {!c.passed && c.suggestion && (
                        <p className="text-slate-500 mt-0.5">{c.suggestion}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <button onClick={handleGenerate} disabled={generating}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {generating ? 'Queuing...' : 'Re-generate with AI'}
            </button>
            <button onClick={() => assetsApi.saveVersion(params.id, { label: new Date().toLocaleString(), content })}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Save version
            </button>
            <button onClick={() => router.push(`/preview/${params.id}`)}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Preview &amp; export
            </button>
          </div>
        </aside>
      </div>
    </FeaturePage>
  );
}
