'use client';

import { useState, useCallback } from 'react';

interface ResumeDownloadButtonProps {
  subdomain: string;
  ownerName?: string;
  /** Custom class name — falls back to a sensible default if omitted */
  className?: string;
  /** Override the label — defaults to "Download Resume" */
  label?: string;
  /** Inline style for the button */
  style?: React.CSSProperties;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/v1';

function flattenResumeContent(content: unknown, ownerName: string, title: string): string {
  if (!content || typeof content !== 'object') return '';

  const c = content as Record<string, unknown>;
  const sections: string[] = [];

  const asStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  sections.push(`${ownerName.toUpperCase()}`);
  sections.push(`${title}`);
  sections.push('');

  // Summary
  const summary = asStr(asRecord(c.summary).body) || asStr(c.summary);
  if (summary) {
    sections.push('PROFESSIONAL SUMMARY');
    sections.push('─'.repeat(40));
    sections.push(summary);
    sections.push('');
  }

  // Experience
  const expItems = asArr(asRecord(c.experience).items || c.experience);
  if (expItems.length > 0) {
    sections.push('EXPERIENCE');
    sections.push('─'.repeat(40));
    for (const item of expItems) {
      const row = asRecord(item);
      const role = asStr(row.role);
      const company = asStr(row.company);
      const period = asStr(row.period);
      const bullets = asStr(row.bullets || row.summary);
      if (role) {
        sections.push(`${role}${company ? ` — ${company}` : ''}${period ? `  |  ${period}` : ''}`);
        if (bullets) sections.push(bullets);
        sections.push('');
      }
    }
  }

  // Education
  const eduItems = asArr(asRecord(c.education).items || c.education);
  if (eduItems.length > 0) {
    sections.push('EDUCATION');
    sections.push('─'.repeat(40));
    for (const item of eduItems) {
      const row = asRecord(item);
      const degree = asStr(row.degree);
      const institution = asStr(row.institution);
      const year = asStr(row.year);
      if (degree) sections.push(`${degree}${institution ? ` — ${institution}` : ''}${year ? ` (${year})` : ''}`);
    }
    sections.push('');
  }

  // Skills
  const skillItems = asArr(asRecord(c.skills).items || c.skills);
  if (skillItems.length > 0) {
    sections.push('SKILLS');
    sections.push('─'.repeat(40));
    sections.push(skillItems.map((s) => asStr(s)).filter(Boolean).join('  ·  '));
    sections.push('');
  }

  // Certifications
  const certItems = asArr(asRecord(c.certifications).items || c.certifications);
  if (certItems.length > 0) {
    sections.push('CERTIFICATIONS');
    sections.push('─'.repeat(40));
    for (const item of certItems) {
      const s = typeof item === 'string' ? item : asStr(asRecord(item).title);
      if (s) sections.push(`• ${s}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

export function ResumeDownloadButton({
  subdomain,
  ownerName = 'Professional',
  className,
  label = 'Download Resume',
  style,
}: ResumeDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/public/${subdomain}/resume`);
      if (!res.ok) throw new Error('Resume not available');
      const data = (await res.json()) as { title?: string; ownerName?: string; content?: unknown };

      const title = data.title || `${ownerName} Resume`;
      const name = data.ownerName || ownerName;
      const plainText = flattenResumeContent(data.content, name, title);

      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!printWindow) throw new Error('Pop-up blocked — please allow pop-ups for this site');

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111;
      background: #fff;
      padding: 2cm 2.2cm;
      max-width: 21cm;
      margin: 0 auto;
    }
    h1 { font-size: 22pt; letter-spacing: 0.05em; margin-bottom: 2pt; }
    h2 { font-size: 9.5pt; font-weight: normal; color: #555; letter-spacing: 0.08em; margin-bottom: 18pt; font-family: 'Helvetica Neue', sans-serif; text-transform: uppercase; }
    .section { margin-bottom: 18pt; }
    .section-title {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #333;
      border-bottom: 0.5pt solid #ccc;
      padding-bottom: 3pt;
      margin-bottom: 10pt;
    }
    .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
    .exp-role { font-weight: 700; font-size: 10.5pt; }
    .exp-period { font-size: 9pt; color: #666; font-family: 'Helvetica Neue', sans-serif; }
    .exp-company { font-size: 9.5pt; color: #444; margin-bottom: 5pt; }
    .bullets { white-space: pre-wrap; font-size: 10pt; color: #222; line-height: 1.65; }
    .skills { font-size: 10pt; color: #333; font-family: 'Helvetica Neue', sans-serif; }
    .cert { font-size: 10pt; color: #333; margin-bottom: 3pt; }
    .edu-row { font-size: 10pt; margin-bottom: 4pt; }
    .edu-institution { color: #555; font-size: 9.5pt; }
    p { margin-bottom: 0; }
    @media print {
      body { padding: 0; }
      @page { margin: 2cm 2.2cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(name)}</h1>
  <h2>${escapeHtml(title)}</h2>
  ${buildResumeHtml(data.content, name, title)}
  <p style="font-size:8pt;color:#bbb;margin-top:24pt;text-align:right;">Generated from portfolio · ${new Date().toLocaleDateString()}</p>
</body>
</html>`);
      printWindow.document.close();

      // Slight delay to let styles apply then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 400);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }, [subdomain, ownerName]);

  const defaultClass = 'inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50';

  return (
    <div>
      <button
        type="button"
        data-resume-download
        onClick={() => void handleDownload()}
        disabled={loading}
        className={className ?? defaultClass}
        style={style}
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Preparing…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildResumeHtml(content: unknown, _name: string, _title: string): string {
  if (!content || typeof content !== 'object') return '';

  const c = content as Record<string, unknown>;
  const asStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const parts: string[] = [];

  // Summary
  const summary = asStr(asRecord(c.summary).body) || asStr(c.summary);
  if (summary) {
    parts.push(`<div class="section"><div class="section-title">Professional Summary</div><p>${escapeHtml(summary)}</p></div>`);
  }

  // Experience
  const expItems = asArr(asRecord(c.experience).items || c.experience);
  if (expItems.length > 0) {
    const rows = expItems.map((item) => {
      const row = asRecord(item);
      const role = asStr(row.role);
      const company = asStr(row.company);
      const period = asStr(row.period);
      const bullets = asStr(row.bullets || row.summary);
      if (!role) return '';
      return `<div style="margin-bottom:12pt;">
        <div class="exp-header">
          <span class="exp-role">${escapeHtml(role)}</span>
          ${period ? `<span class="exp-period">${escapeHtml(period)}</span>` : ''}
        </div>
        ${company ? `<div class="exp-company">${escapeHtml(company)}</div>` : ''}
        ${bullets ? `<div class="bullets">${escapeHtml(bullets)}</div>` : ''}
      </div>`;
    }).filter(Boolean).join('');
    if (rows) parts.push(`<div class="section"><div class="section-title">Experience</div>${rows}</div>`);
  }

  // Education
  const eduItems = asArr(asRecord(c.education).items || c.education);
  if (eduItems.length > 0) {
    const rows = eduItems.map((item) => {
      const row = asRecord(item);
      const degree = asStr(row.degree);
      const institution = asStr(row.institution);
      const year = asStr(row.year);
      if (!degree) return '';
      return `<div class="edu-row">
        <strong>${escapeHtml(degree)}</strong>${year ? ` <span style="color:#666">(${escapeHtml(year)})</span>` : ''}
        ${institution ? `<div class="edu-institution">${escapeHtml(institution)}</div>` : ''}
      </div>`;
    }).filter(Boolean).join('');
    if (rows) parts.push(`<div class="section"><div class="section-title">Education</div>${rows}</div>`);
  }

  // Skills
  const skillItems = asArr(asRecord(c.skills).items || c.skills);
  if (skillItems.length > 0) {
    const list = skillItems.map((s) => escapeHtml(asStr(s))).filter(Boolean).join(' &nbsp;·&nbsp; ');
    parts.push(`<div class="section"><div class="section-title">Skills</div><div class="skills">${list}</div></div>`);
  }

  // Certifications
  const certItems = asArr(asRecord(c.certifications).items || c.certifications);
  if (certItems.length > 0) {
    const list = certItems.map((item) => {
      const s = typeof item === 'string' ? item : asStr(asRecord(item).title);
      return s ? `<div class="cert">• ${escapeHtml(s)}</div>` : '';
    }).filter(Boolean).join('');
    if (list) parts.push(`<div class="section"><div class="section-title">Certifications</div>${list}</div>`);
  }

  return parts.join('');
}
