'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { collabApi, assetsApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';

interface Comment {
  id: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  user: { id: string; fullName: string };
}

export default function CollaboratePage({ params }: { params: { id: string } }) {
  const user = useBloxStore((s) => s.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [assetTitle, setAssetTitle] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copying, setCopying] = useState(false);

  const load = useCallback(async () => {
    try {
      const [commentsData, asset] = await Promise.all([
        collabApi.getComments(params.id) as Promise<Comment[]>,
        assetsApi.getById(params.id) as Promise<{ title: string; publishedUrl?: string }>,
      ]);
      setComments(commentsData);
      setAssetTitle(asset.title);
      setShareLink(asset.publishedUrl ?? '');
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const comment = await collabApi.addComment(params.id, newComment) as Comment;
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await collabApi.resolveComment(commentId);
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, resolved: true } : c));
    } catch { /* ignore */ }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    setCopying(true);
    await navigator.clipboard.writeText(shareLink);
    setTimeout(() => setCopying(false), 2000);
  };

  const open = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);

  return (
    <FeaturePage
      title={assetTitle ? `Collaborate: ${assetTitle}` : 'Collaboration workspace'}
      description="Leave comments, resolve feedback, and share your asset."
      minTier={PlanTier.PREMIUM}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Comments */}
        <div className="space-y-4">
          {/* New comment */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-bold text-slate-900 mb-2">Add a comment</label>
            <textarea rows={3} value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="@mention collaborators or leave feedback..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <button onClick={handlePost} disabled={posting || !newComment.trim()}
              className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {posting ? 'Posting...' : 'Post comment'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : (
            <>
              {/* Open comments */}
              {open.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Open ({open.length})</h3>
                  <div className="space-y-3">
                    {open.map((c) => (
                      <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                              {c.user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{c.user.fullName}</p>
                              <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          {c.user.id !== user.id && (
                            <button onClick={() => handleResolve(c.id)}
                              className="shrink-0 rounded-md border border-green-200 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                              Resolve
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-700">{c.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved */}
              {resolved.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 mb-3">
                    Resolved ({resolved.length})
                  </summary>
                  <div className="space-y-3 mt-3">
                    {resolved.map((c) => (
                      <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 opacity-70">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            {c.user.fullName.charAt(0)}
                          </div>
                          <p className="text-xs text-slate-500">{c.user.fullName} · {new Date(c.createdAt).toLocaleString()}</p>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Resolved</span>
                        </div>
                        <p className="text-sm text-slate-500 line-through">{c.body}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {comments.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                  <p className="text-sm">No comments yet. Be the first to leave feedback.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Share */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Share link</h3>
            {shareLink ? (
              <div className="space-y-2">
                <p className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700 break-all">
                  {shareLink}
                </p>
                <button onClick={handleCopyLink}
                  className="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">
                  {copying ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Publish your asset to get a shareable link.</p>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Feedback summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Open</dt>
                <dd className="font-medium text-slate-900">{open.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Resolved</dt>
                <dd className="font-medium text-slate-900">{resolved.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total</dt>
                <dd className="font-medium text-slate-900">{comments.length}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </FeaturePage>
  );
}
