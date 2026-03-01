'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { FileText, PlusCircle, ArrowUpRight, ScanSearch, Download } from 'lucide-react';

interface ResumeAsset {
  id: string;
  title: string;
  type: AssetType;
  healthScore?: number | null;
  updatedAt: string;
}

type ExportFormat = 'pdf' | 'docx';

const ROLE_FILTERS = ['All', 'Frontend', 'Backend', 'Product', 'Design', 'Data'] as const;

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

function inferRole(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes('frontend')) return 'Frontend';
  if (normalized.includes('backend')) return 'Backend';
  if (normalized.includes('product')) return 'Product';
  if (normalized.includes('design')) return 'Design';
  if (normalized.includes('data')) return 'Data';
  return 'General';
}

function flattenText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => flattenText(item)).join('\n');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((item) => flattenText(item))
      .join('\n');
  }
  return '';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toFilename(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'resume';
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>('All');
  const [targetFilter, setTargetFilter] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState('');

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetsApi.list(AssetType.RESUME);
      setResumes(Array.isArray(data) ? (data as ResumeAsset[]) : []);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const filteredResumes = useMemo(() => {
    return resumes.filter((resume) => {
      const matchesRole = roleFilter === 'All' || inferRole(resume.title) === roleFilter;
      const matchesTarget =
        targetFilter.trim().length === 0 ||
        resume.title.toLowerCase().includes(targetFilter.trim().toLowerCase());
      return matchesRole && matchesTarget;
    });
  }, [resumes, roleFilter, targetFilter]);

  const handleExport = useCallback(async (assetId: string, format: ExportFormat) => {
    setExportingId(assetId);
    setExportMessage('');
    try {
      const fullAsset = await assetsApi.getById(assetId) as {
        title?: string;
        content?: unknown;
        updatedAt?: string;
      };

      const title = fullAsset.title ?? 'Resume';
      const body = flattenText(fullAsset.content) || 'No resume content found.';
      const filename = toFilename(title);

      if (format === 'docx') {
        const html = `
          <html>
            <head><meta charset="utf-8" /></head>
            <body>
              <h1>${escapeHtml(title)}</h1>
              <p>Exported on ${escapeHtml(new Date().toLocaleString())}</p>
              <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;">${escapeHtml(body)}</pre>
            </body>
          </html>
        `;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.doc`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else {
        const exportWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!exportWindow) throw new Error('Pop-up blocked. Allow pop-ups to export PDF.');

        exportWindow.document.write(`
          <html>
            <head>
              <title>${escapeHtml(title)} - PDF Export</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
                h1 { margin-bottom: 8px; }
                p { color: #444; margin-bottom: 20px; }
                pre { white-space: pre-wrap; line-height: 1.5; font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              <h1>${escapeHtml(title)}</h1>
              <p>Exported on ${escapeHtml(new Date().toLocaleString())}</p>
              <pre>${escapeHtml(body)}</pre>
            </body>
          </html>
        `);
        exportWindow.document.close();
        exportWindow.focus();
        exportWindow.print();
      }

      setExportMessage(`${title} exported as ${format.toUpperCase()}.`);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setExportingId(null);
    }
  }, []);

  return (
    <FeaturePage
      title="Resumes & CVs"
      description="Manage all resumes and CVs with role filters, ATS preview, tailoring actions, and PDF/DOCX export."
      headerIcon={<FileText className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  roleFilter === role
                    ? 'border border-[#1ECEFA]/40 bg-[#1ECEFA]/15 text-[#1ECEFA]'
                    : 'border border-white/10 bg-black/20 text-slate-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <Link
            href="/resumes/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white"
          >
            <PlusCircle className="h-4 w-4" />
            New Resume
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Target Role / Search
          </label>
          <input
            value={targetFilter}
            onChange={(event) => setTargetFilter(event.target.value)}
            placeholder="Filter by role or target title..."
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
          />
        </div>

        {exportMessage ? (
          <div className="rounded-lg border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#1ECEFA]">
            {exportMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-12 text-center">
            <p className="text-sm text-slate-400">No resumes match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredResumes.map((resume) => (
              <article
                key={resume.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
              >
                <h2 className="line-clamp-2 text-base font-bold text-white">{resume.title}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <p>
                    ATS Score Preview: <span className="font-bold text-white">{resume.healthScore ?? 0}%</span>
                  </p>
                  <p>
                    Last Tailored: <span className="font-bold text-white">{formatDate(resume.updatedAt)}</span>
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/resumes/${resume.id}/edit`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    Edit <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/scanner?assetId=${encodeURIComponent(resume.id)}`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    <ScanSearch className="h-3.5 w-3.5" />
                    Tailor for Job
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleExport(resume.id, 'pdf')}
                    disabled={exportingId === resume.id}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingId === resume.id ? 'Exporting...' : 'Export PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(resume.id, 'docx')}
                    disabled={exportingId === resume.id}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export DOCX
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
