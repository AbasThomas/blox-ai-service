'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { FileText, Plus, ArrowUpRight, ScanSearch, Download } from '@/components/ui/icons';

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
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    return Object.values(value as Record<string, unknown>).map((item) => flattenText(item)).join('\n');
  }
  return '';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function toFilename(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'resume';
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

  useEffect(() => { loadResumes(); }, [loadResumes]);

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
      const fullAsset = await assetsApi.getById(assetId) as { title?: string; content?: unknown; updatedAt?: string };
      const title = fullAsset.title ?? 'Resume';
      const body = flattenText(fullAsset.content) || 'No resume content found.';
      const filename = toFilename(title);

      if (format === 'docx') {
        const html = `<html><head><meta charset="utf-8" /></head><body><h1>${escapeHtml(title)}</h1><p>Exported on ${escapeHtml(new Date().toLocaleString())}</p><pre style="white-space:pre-wrap;">${escapeHtml(body)}</pre></body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${filename}.doc`;
        document.body.appendChild(link); link.click(); link.remove();
        URL.revokeObjectURL(url);
      } else {
        const exportWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!exportWindow) throw new Error('Pop-up blocked. Allow pop-ups to export PDF.');
        exportWindow.document.write(`<html><head><title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;padding:32px;color:#111;}pre{white-space:pre-wrap;}</style></head><body><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(body)}</pre></body></html>`);
        exportWindow.document.close(); exportWindow.focus(); exportWindow.print();
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
      description="Manage all resumes with role filters, ATS preview, and PDF/DOCX export."
    >
      <div className="space-y-5">
        {/* Filters + actions row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center h-8 rounded border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
            {ROLE_FILTERS.map((role, i) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`h-8 px-3 text-[12px] font-medium transition-colors border-r border-[#1B2131] last:border-r-0 ${
                  roleFilter === role
                    ? 'bg-[#141C28] text-white'
                    : 'text-[#46566A] hover:text-[#8899AA]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/resumes/drafts"
              className="inline-flex items-center h-8 px-3 rounded border border-[#1B2131] text-[12px] font-medium text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
            >
              Drafts
            </Link>
            <Link
              href="/resumes/new"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
            >
              <Plus size={13} strokeWidth={3} /> New Resume
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            placeholder="Search by role or title..."
            className="w-full h-9 rounded border border-[#1B2131] bg-[#0B0E14] px-3 text-[13px] text-white placeholder-[#3A4452] outline-none focus:border-[#2A3A50] transition-colors"
          />
        </div>

        {/* Export message */}
        {exportMessage && (
          <div className="rounded border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 px-3 py-2 text-[12px] text-[#1ECEFA]">
            {exportMessage}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
            ))}
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#1B2131] p-12 text-center gap-2">
            <FileText size={22} className="text-[#2E3847]" />
            <p className="text-[13px] text-[#4E5C6E]">No resumes match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResumes.map((resume) => (
              <article
                key={resume.id}
                className="rounded-md border border-[#1B2131] bg-[#0B0E14] px-4 py-4 hover:border-[#2A3A50] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold text-white truncate">{resume.title}</h2>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[#4E5C6E]">
                      <span>ATS <span className="text-white font-medium">{resume.healthScore ?? 0}%</span></span>
                      <span>·</span>
                      <span>Updated <span className="text-white font-medium">{formatDate(resume.updatedAt)}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/resumes/${resume.id}/edit`}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                    >
                      Edit <ArrowUpRight size={11} />
                    </Link>
                    <Link
                      href={`/scanner?assetId=${encodeURIComponent(resume.id)}`}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                    >
                      <ScanSearch size={11} /> Tailor
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleExport(resume.id, 'pdf')}
                      disabled={exportingId === resume.id}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] disabled:opacity-40 transition-colors"
                    >
                      <Download size={11} /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport(resume.id, 'docx')}
                      disabled={exportingId === resume.id}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] disabled:opacity-40 transition-colors"
                    >
                      <Download size={11} /> DOCX
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
