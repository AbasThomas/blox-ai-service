'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { assetsApi, scannerApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';

interface ScanResult {
  assetId: string;
  matchScore: number;
  presentKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export default function ScannerPage() {
  const user = useBloxStore((s) => s.user);
  const [jobDesc, setJobDesc] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assets, setAssets] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    assetsApi.list().then((data) => setAssets(data as typeof assets)).catch(() => undefined);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDesc.trim()) { setError('Paste a job description or URL'); return; }
    if (!assetId) { setError('Select an asset to scan against'); return; }
    setScanning(true); setError(''); setResult(null);
    try {
      const res = await scannerApi.scan({ assetId, jobDescription: jobDesc }) as ScanResult;
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally { setScanning(false); }
  };

  const handleDuplicate = async () => {
    if (!assetId) return;
    setDuplicating(true);
    try {
      const copy = await assetsApi.duplicate(assetId, { jobDescription: jobDesc }) as { id: string; type: string };
      router.push(`/${copy.type.toLowerCase().replace('_', '-')}s/${copy.id}/edit`);
    } catch { setDuplicating(false); }
  };

  const scoreColor = result
    ? result.matchScore >= 70 ? 'text-green-600' : result.matchScore >= 40 ? 'text-amber-600' : 'text-red-600'
    : '';

  return (
    <FeaturePage title="Job Optimization Scanner" description="Paste a job description to see how well your asset matches — and auto-create a tailored version.">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Input */}
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label htmlFor="asset-select" className="block text-sm font-medium text-slate-700 mb-1">Select asset to scan</label>
            <select id="asset-select" value={assetId} onChange={(e) => setAssetId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Choose an asset —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.title} ({a.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="job-desc" className="block text-sm font-medium text-slate-700 mb-1">Job description</label>
            <textarea id="job-desc" rows={10} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Paste the full job description here..."/>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={scanning}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
            {scanning ? 'Scanning...' : 'Scan now'}
          </button>
        </form>

        {/* Results */}
        <aside className="space-y-4">
          {!result ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-sm">Results will appear here after scanning.</p>
            </div>
          ) : (
            <>
              {/* Match score */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className={`text-5xl font-black ${scoreColor}`}>{result.matchScore}%</p>
                <p className="mt-1 text-sm text-slate-500">Job Match Score</p>
                <div className="mt-3 h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${result.matchScore}%` }} />
                </div>
              </div>

              {/* Keywords */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Present keywords ({result.presentKeywords.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {result.presentKeywords.slice(0, 10).map((kw) => (
                    <span key={kw} className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Missing keywords ({result.missingKeywords.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {result.missingKeywords.slice(0, 10).map((kw) => (
                    <span key={kw} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Suggestions</h3>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-amber-500">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Create tailored */}
              <button onClick={handleDuplicate} disabled={duplicating}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {duplicating ? 'Creating...' : '✨ Create tailored version'}
              </button>
              {user.tier === PlanTier.FREE && (
                <p className="text-xs text-center text-slate-500">Bulk scanning available on Pro & above.</p>
              )}
            </>
          )}
        </aside>
      </div>
    </FeaturePage>
  );
}

