'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';

const TAG_SUGGESTIONS = ['Career advice', 'Resume tips', 'Portfolio design', 'Job search', 'Tech skills', 'Productivity', 'Freelancing', 'Salary negotiation'];

interface BlogContent {
  draft?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  status?: 'draft' | 'published' | 'scheduled';
}

export default function BlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<BlogContent>({ draft: '', tags: [], status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'seo' | 'publish'>('write');
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  const load = useCallback(async () => {
    try {
      const asset = await assetsApi.getById(params.id) as { title: string; content: BlogContent };
      setTitle(asset.title);
      if (asset.content) setContent(asset.content);
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const words = (content.draft ?? '').trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadTime(Math.max(1, Math.round(words / 200)));
  }, [content.draft]);

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

  const toggleTag = (tag: string) => {
    const tags = content.tags ?? [];
    setContent((prev) => ({
      ...prev,
      tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    }));
  };

  const update = (patch: Partial<BlogContent>) => setContent((prev) => ({ ...prev, ...patch }));

  return (
    <FeaturePage title={title || 'Blog post editor'} description="Draft, optimise, and schedule blog posts for your portfolio.">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Editor */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleSave} disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? 'Saving...' : saveMsg || 'Save'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 pb-2">
            {([['write', 'Write'], ['seo', 'SEO'], ['publish', 'Publish']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'write' && (
            <div className="space-y-3">
              <textarea rows={20} value={content.draft ?? ''}
                onChange={(e) => update({ draft: e.target.value })}
                placeholder="Write your post in plain text or Markdown..."
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm font-mono" />
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{wordCount} words</span>
                <span>{readTime} min read</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${
                  content.status === 'published' ? 'bg-green-100 text-green-700' :
                  content.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{content.status ?? 'draft'}</span>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">SEO settings</h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SEO title <span className={`ml-1 ${(content.seoTitle?.length ?? 0) > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                    {content.seoTitle?.length ?? 0}/60
                  </span>
                </label>
                <input value={content.seoTitle ?? ''} onChange={(e) => update({ seoTitle: e.target.value })}
                  placeholder="Optimised title for search engines"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Meta description <span className={`ml-1 ${(content.seoDescription?.length ?? 0) > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                    {content.seoDescription?.length ?? 0}/160
                  </span>
                </label>
                <textarea rows={3} value={content.seoDescription ?? ''} onChange={(e) => update({ seoDescription: e.target.value })}
                  placeholder="Brief summary for search results"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        (content.tags ?? []).includes(tag)
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'publish' && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Publish settings</h3>
              <div className="grid gap-3">
                {(['draft', 'published', 'scheduled'] as const).map((s) => (
                  <button key={s} onClick={() => update({ status: s })}
                    className={`rounded-xl border p-3 text-left capitalize transition-colors ${
                      content.status === s ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{s}</p>
                    <p className="text-xs text-slate-500">
                      {s === 'draft' ? 'Visible only to you' :
                       s === 'published' ? 'Live on your portfolio immediately' :
                       'Go live at a scheduled time'}
                    </p>
                  </button>
                ))}
              </div>
              {content.status === 'scheduled' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Publish date & time</label>
                  <input type="datetime-local" value={content.scheduledAt ?? ''}
                    onChange={(e) => update({ scheduledAt: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : `Save as ${content.status}`}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Stats</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Words</dt>
                <dd className="font-medium text-slate-900">{wordCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Read time</dt>
                <dd className="font-medium text-slate-900">{readTime} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tags</dt>
                <dd className="font-medium text-slate-900">{(content.tags ?? []).length}</dd>
              </div>
            </dl>
          </div>

          {(content.tags ?? []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {(content.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </FeaturePage>
  );
}
