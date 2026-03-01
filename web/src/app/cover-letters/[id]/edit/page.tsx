'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';

type Tone = 'professional' | 'confident' | 'concise' | 'technical' | 'enthusiastic';

interface CoverLetterContent {
  jobDescription?: string;
  tone?: Tone;
  opening?: string;
  body?: string;
  closing?: string;
}

const TONES: Array<{ id: Tone; label: string; desc: string }> = [
  { id: 'professional', label: 'Professional', desc: 'Formal, polished tone' },
  { id: 'confident', label: 'Confident', desc: 'Bold and assertive' },
  { id: 'concise', label: 'Concise', desc: 'Brief and to the point' },
  { id: 'technical', label: 'Technical', desc: 'Skills and specs focused' },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic and passionate' },
];

export default function CoverLetterEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<CoverLetterContent>({
    tone: 'professional',
    jobDescription: '',
    opening: '',
    body: '',
    closing: '',
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [activeSection, setActiveSection] = useState<'job' | 'tone' | 'edit'>('job');
  const [wordCount, setWordCount] = useState(0);
  const [prefilledJobUrl, setPrefilledJobUrl] = useState(false);

  const loadAsset = useCallback(async () => {
    try {
      const asset = await assetsApi.getById(params.id) as {
        title: string;
        content: CoverLetterContent;
        generatingStatus?: string;
      };
      setTitle(asset.title);
      if (asset.content) setContent(asset.content);
      setGeneratingStatus(asset.generatingStatus ?? '');
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { loadAsset(); }, [loadAsset]);

  useEffect(() => {
    if (generatingStatus !== 'processing' && generatingStatus !== 'queued') return;
    const timer = setInterval(loadAsset, 5000);
    return () => clearInterval(timer);
  }, [generatingStatus, loadAsset]);

  useEffect(() => {
    if (prefilledJobUrl) return;
    const jobUrl = searchParams.get('jobUrl');
    if (!jobUrl) {
      setPrefilledJobUrl(true);
      return;
    }

    setContent((prev) => {
      if (prev.jobDescription?.trim()) return prev;
      return { ...prev, jobDescription: `Job URL: ${jobUrl}` };
    });
    setPrefilledJobUrl(true);
  }, [prefilledJobUrl, searchParams]);

  // Word count
  useEffect(() => {
    const text = [content.opening, content.body, content.closing].filter(Boolean).join(' ');
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, [content.opening, content.body, content.closing]);

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
    if (!content.jobDescription?.trim()) return;
    setGenerating(true);
    try {
      // Save job desc + tone first
      await assetsApi.update(params.id, { content });
      await assetsApi.generate(params.id, `Generate a ${content.tone} cover letter for: ${content.jobDescription?.slice(0, 200)}`);
      setGeneratingStatus('queued');
      setActiveSection('edit');
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  };

  const updateContent = (patch: Partial<CoverLetterContent>) =>
    setContent((prev) => ({ ...prev, ...patch }));

  const fullText = [content.opening, content.body, content.closing].filter(Boolean).join('\n\n');

  return (
    <FeaturePage title={title || 'Cover letter'} description="Generate and refine your personalised cover letter.">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cover letter title" />
            <button onClick={handleSave} disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? 'Saving...' : saveMsg || 'Save'}
            </button>
          </div>

          {(generatingStatus === 'processing' || generatingStatus === 'queued') && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
              <p className="text-sm text-blue-800">AI is drafting your cover letter...</p>
            </div>
          )}

          {/* Step tabs */}
          <div className="flex gap-1 border-b border-slate-200 pb-2">
            {([['job', 'Job description'], ['tone', 'Tone'], ['edit', 'Edit letter']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeSection === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Job description */}
          {activeSection === 'job' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block text-sm font-bold text-slate-900 mb-2">Paste job description or URL</label>
                <textarea rows={10} value={content.jobDescription ?? ''}
                  onChange={(e) => updateContent({ jobDescription: e.target.value })}
                  placeholder="Paste the full job description here. The more detail you provide, the better tailored your cover letter will be."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <button onClick={() => setActiveSection('tone')} disabled={!content.jobDescription?.trim()}
                className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                Next: Choose tone →
              </button>
            </div>
          )}

          {/* Tone */}
          {activeSection === 'tone' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block text-sm font-bold text-slate-900 mb-3">Select writing tone</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TONES.map((t) => (
                    <button key={t.id} type="button" onClick={() => updateContent({ tone: t.id })}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        content.tone === t.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                      <p className="text-xs text-slate-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActiveSection('job')}
                  className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Back
                </button>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex-1 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate cover letter'}
                </button>
              </div>
            </div>
          )}

          {/* Edit letter */}
          {activeSection === 'edit' && (
            <div className="space-y-4">
              {[
                { key: 'opening' as const, label: 'Opening paragraph', placeholder: 'Dear Hiring Manager,\n\nI am writing to express...' },
                { key: 'body' as const, label: 'Main body', placeholder: 'In my previous role at...' },
                { key: 'closing' as const, label: 'Closing paragraph', placeholder: 'I look forward to discussing...\n\nYours sincerely,' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-900">{label}</label>
                  </div>
                  <textarea rows={key === 'body' ? 8 : 4} value={content[key] ?? ''}
                    onChange={(e) => updateContent({ [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Stats */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Letter stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{wordCount}</p>
                <p className="text-xs text-slate-500">Words</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-black ${wordCount >= 150 && wordCount <= 400 ? 'text-green-600' : 'text-amber-600'}`}>
                  {wordCount < 150 ? 'Short' : wordCount > 400 ? 'Long' : 'Good'}
                </p>
                <p className="text-xs text-slate-500">Length</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400 text-center">Ideal: 150–400 words</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={handleGenerate} disabled={generating || !content.jobDescription?.trim()}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {generating ? 'Generating...' : 'Re-generate'}
            </button>
            <button onClick={() => router.push(`/preview/${params.id}`)}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Preview &amp; export
            </button>
          </div>

          {/* Full preview */}
          {fullText && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Preview</p>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-20">{fullText}</p>
            </div>
          )}
        </aside>
      </div>
    </FeaturePage>
  );
}
