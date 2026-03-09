'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';

interface MacOSTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

// ── types ──────────────────────────────────────────────────────────────────────

interface WinState {
  id: string;
  title: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

type AppId = 'finder' | 'terminal' | 'safari' | 'vscode' | 'contact';
type FinderView = 'about' | 'projects' | 'stack' | 'experience' | 'contact' | 'documents';

// ── icon helpers ───────────────────────────────────────────────────────────────

const Icon = {
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  Folder: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  Code: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
  Send: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  Cloud: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>,
  File: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  ArrowUpRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>,
  Briefcase: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Mail: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  Terminal: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
  Globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Star: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="m9 18 6-6-6-6" /></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="m15 18-6-6 6-6" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>,
  Battery: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="1" y="6" width="18" height="12" rx="2" /><line x1="23" y1="13" x2="23" y2="11" /><line x1="5" y1="10" x2="5" y2="14" /><line x1="9" y1="10" x2="9" y2="14" /></svg>,
  Wifi: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" /></svg>,
};

// ── project icon colors ────────────────────────────────────────────────────────

const PROJECT_ACCENTS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
];

// ── terminal typewriter ────────────────────────────────────────────────────────

function TerminalContent({ profile }: { profile: PublicProfilePayload }) {
  const { user, sections } = profile;
  const name = user.fullName || 'Professional';
  const lines = useMemo(() => [
    { delay: 0, text: `$ whoami`, color: '#00ff41' },
    { delay: 300, text: `→ ${name}`, color: '#e2e8f0' },
    { delay: 700, text: `$ cat headline.txt`, color: '#00ff41' },
    { delay: 1000, text: `→ ${user.headline || 'Creative Professional'}`, color: '#e2e8f0' },
    { delay: 1400, text: `$ ls skills/`, color: '#00ff41' },
    { delay: 1700, text: sections.skills.slice(0, 8).join('  ') || 'No skills listed', color: '#93c5fd' },
    { delay: 2200, text: `$ ls experience/`, color: '#00ff41' },
    ...sections.experience.slice(0, 3).map((exp, i) => ({
      delay: 2500 + i * 300,
      text: `→ ${exp.role}${exp.company ? ` @ ${exp.company}` : ''}${exp.period ? `  [${exp.period}]` : ''}`,
      color: '#fcd34d',
    })),
    { delay: 3500, text: `$ cat about.md`, color: '#00ff41' },
    { delay: 3800, text: (sections.about || 'Building great things.').slice(0, 120) + '...', color: '#d1d5db' },
    { delay: 4400, text: `$ echo "Open to opportunities: ✓"`, color: '#00ff41' },
    { delay: 4700, text: `Open to opportunities: ✓`, color: '#34d399' },
    { delay: 5000, text: `$ _`, color: '#00ff41' },
  ], [name, user.headline, sections]);

  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let i = 0;
    const advance = () => {
      if (i >= lines.length) return;
      const line = lines[i];
      const timer = setTimeout(() => {
        setVisible((v) => v + 1);
        i++;
        advance();
      }, i === 0 ? 500 : lines[i].delay - lines[i - 1].delay);
      return timer;
    };
    const t = advance();
    return () => clearTimeout(t ?? 0);
  }, [lines]);

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: '#1a1a2e', fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 13 }}>
      <div className="mb-3 flex items-center gap-2 opacity-60" style={{ color: '#94a3b8', fontSize: 11 }}>
        <span>Last login: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} on ttys000</span>
      </div>
      {lines.slice(0, visible).map((line, i) => (
        <div key={i} className="mb-1 leading-relaxed" style={{ color: line.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {line.text}
        </div>
      ))}
    </div>
  );
}

// ── safari (projects browser) ──────────────────────────────────────────────────

function SafariContent({ profile }: { profile: PublicProfilePayload }) {
  const [url] = useState('https://portfolio.blox.app/projects');
  const { sections } = profile;

  return (
    <div className="h-full flex flex-col" style={{ background: '#fff' }}>
      {/* URL bar */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <div className="flex items-center gap-1 text-gray-400">
          <div className="w-3 h-3"><Icon.ChevronLeft /></div>
          <div className="w-3 h-3 opacity-40"><Icon.ChevronRight /></div>
        </div>
        <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 text-green-500"><Icon.Globe /></div>
          {url}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-2xl font-semibold text-slate-800 mb-1">Projects</h2>
        <p className="text-sm text-slate-500 mb-6">{sections.projects.length} public projects</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.projects.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400 text-sm">No projects added yet.</div>
          ) : (
            sections.projects.map((p, i) => {
              const acc = PROJECT_ACCENTS[i % PROJECT_ACCENTS.length];
              const img = p.snapshotUrl || p.imageUrl || p.images?.[0]?.url;
              return (
                <a key={i} href={p.url ?? '#'} target="_blank" rel="noreferrer"
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400/60 hover:shadow-lg transition-all bg-white block">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.title} className="w-full aspect-video object-cover opacity-90 group-hover:opacity-100" loading="lazy" />
                  ) : (
                    <div className={`w-full aspect-video flex items-center justify-center ${acc.bg}`}>
                      <div className={`w-10 h-10 ${acc.text} opacity-40`}><Icon.Zap /></div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                      <div className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5"><Icon.ArrowUpRight /></div>
                    </div>
                    {p.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{p.description}</p>}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-medium">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── vscode content ─────────────────────────────────────────────────────────────

function VSCodeContent({ profile }: { profile: PublicProfilePayload }) {
  const { user, sections } = profile;
  const code = `// profile.tsx — ${user.fullName}
// Generated by Blox Portfolio

export const profile = {
  name: "${user.fullName}",
  headline: "${user.headline || 'Creative Professional'}",

  about: \`${(sections.about || 'Building great things.').slice(0, 120)}...\`,

  skills: [
${sections.skills.slice(0, 10).map((s) => `    "${s}"`).join(',\n')},
  ],

  experience: [
${sections.experience.slice(0, 3).map((e) => `    {
      role: "${e.role}",${e.company ? `\n      company: "${e.company}",` : ''}${e.period ? `\n      period: "${e.period}",` : ''}${e.summary ? `\n      summary: "${e.summary?.slice(0, 80)}...",` : ''}
    }`).join(',\n')},
  ],

  projects: [
${sections.projects.slice(0, 3).map((p) => `    {
      title: "${p.title}",
      description: "${(p.description || '').slice(0, 60)}...",${p.url ? `\n      url: "${p.url}",` : ''}${p.tags ? `\n      tags: ${JSON.stringify(p.tags.slice(0, 3))},` : ''}
    }`).join(',\n')},
  ],
} as const;`;

  const colorize = (line: string, i: number) => {
    if (line.trimStart().startsWith('//')) return <span key={i} style={{ color: '#6a9955' }}>{line}</span>;
    if (line.includes('export const')) return (
      <span key={i}>
        <span style={{ color: '#569cd6' }}>export const </span>
        <span style={{ color: '#9cdcfe' }}>profile</span>
        <span style={{ color: '#d4d4d4' }}> = {'{'}</span>
      </span>
    );
    const strMatch = line.match(/^(\s*)([\w]+)(:)(\s*)(.+)/);
    if (strMatch) {
      return (
        <span key={i}>
          <span style={{ color: '#d4d4d4' }}>{strMatch[1]}</span>
          <span style={{ color: '#9cdcfe' }}>{strMatch[2]}</span>
          <span style={{ color: '#d4d4d4' }}>{strMatch[3]}</span>
          <span style={{ color: '#ce9178' }}>{strMatch[4]}{strMatch[5]}</span>
        </span>
      );
    }
    return <span key={i} style={{ color: '#d4d4d4' }}>{line}</span>;
  };

  return (
    <div className="h-full flex" style={{ background: '#1e1e1e', fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 12 }}>
      {/* Activity bar */}
      <div className="w-10 flex flex-col items-center pt-3 gap-5" style={{ background: '#333333' }}>
        {[Icon.File, Icon.Search, Icon.Folder, Icon.Code].map((Ic, i) => (
          <div key={i} className={`w-5 h-5 ${i === 0 ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors cursor-pointer`}><Ic /></div>
        ))}
      </div>
      {/* File explorer */}
      <div className="w-36 border-r border-white/10 pt-4 px-2 shrink-0" style={{ background: '#252526' }}>
        <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 px-1">Explorer</div>
        {['profile.tsx', 'projects.ts', 'skills.ts', 'contact.ts'].map((f, i) => (
          <div key={f} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${i === 0 ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <div className="w-3 h-3"><Icon.File /></div>
            {f}
          </div>
        ))}
      </div>
      {/* Editor */}
      <div className="flex-1 overflow-auto">
        {/* Tab bar */}
        <div className="flex items-center border-b border-white/10" style={{ background: '#1e1e1e' }}>
          <div className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-white border-t-2 border-blue-400" style={{ background: '#1e1e1e' }}>
            <div className="w-3 h-3 text-blue-400"><Icon.File /></div>
            profile.tsx
          </div>
        </div>
        {/* Code */}
        <div className="p-4 overflow-auto">
          {code.split('\n').map((line, i) => (
            <div key={i} className="flex leading-6">
              <span className="w-8 shrink-0 text-right mr-4 select-none" style={{ color: '#858585', fontSize: 11 }}>{i + 1}</span>
              {colorize(line, i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── contact app ────────────────────────────────────────────────────────────────

function ContactAppContent({ profile, subdomain }: { profile: PublicProfilePayload; subdomain: string }) {
  const { sections, user } = profile;
  const contactEmail = sections.links.find(
    (l) => l.kind === 'contact' || l.url.startsWith('mailto:') || l.label.toLowerCase().includes('email'),
  )?.url.replace('mailto:', '') ?? '';
  const socialLinks = sections.links.filter((l) => l.url.startsWith('http'));

  return (
    <div className="h-full flex" style={{ background: '#fff' }}>
      {/* Sidebar */}
      <div className="w-40 border-r border-gray-200 bg-gray-50 p-3 shrink-0">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Mailboxes</div>
        {['Inbox', 'Sent', 'Drafts', 'Trash'].map((box, i) => (
          <div key={box} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${i === 0 ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-gray-100'}`}>
            <div className="w-3.5 h-3.5"><Icon.Mail /></div>
            {box}
            {i === 0 && <span className="ml-auto text-xs bg-white/30 px-1 rounded-full">1</span>}
          </div>
        ))}
      </div>
      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">Let's Connect</h2>
        <p className="text-sm text-slate-500 mb-6">{sections.contact || 'Open to interesting conversations and collaborations.'}</p>

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {socialLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
                <div className="w-3 h-3"><Icon.Globe /></div>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {profile.resumeAssetId && (
          <div className="mb-6">
            <ResumeDownloadButton
              subdomain={subdomain}
              ownerName={user.fullName}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
            />
          </div>
        )}

        <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Send a message</h3>
          <ContactForm
            recipientEmail={contactEmail}
            theme={{
              formClassName: 'space-y-3',
              labelClassName: 'mb-1 block text-xs font-medium text-slate-500',
              inputClassName: 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all',
              textareaClassName: 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all',
              buttonClassName: 'w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60',
              successClassName: 'rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700',
              errorClassName: 'mt-1 text-xs text-rose-500',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── finder content ─────────────────────────────────────────────────────────────

function FinderContent({ profile, subdomain, view, setView }: {
  profile: PublicProfilePayload;
  subdomain: string;
  view: FinderView;
  setView: (v: FinderView) => void;
}) {
  const { user, sections } = profile;
  const name = user.fullName || 'Portfolio Owner';
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const contactEmail = sections.links.find(
    (l) => l.kind === 'contact' || l.url.startsWith('mailto:') || l.label.toLowerCase().includes('email'),
  )?.url.replace('mailto:', '') ?? '';

  const sidebarItems: Array<{ id: FinderView; label: string; icon: React.ReactNode }> = [
    { id: 'about', label: 'About Me', icon: <Icon.User /> },
    { id: 'projects', label: 'Projects', icon: <Icon.Folder /> },
    { id: 'stack', label: 'Stack', icon: <Icon.Code /> },
    { id: 'experience', label: 'Experience', icon: <Icon.Briefcase /> },
    { id: 'contact', label: 'Contact', icon: <Icon.Send /> },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-44 bg-gray-50/60 border-r border-gray-200/50 p-3 flex flex-col gap-5 shrink-0 overflow-y-auto hidden sm:flex">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Favorites</div>
          <div className="flex flex-col gap-0.5">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors w-full text-left ${view === item.id ? 'bg-black/[0.07] text-slate-800 font-medium' : 'text-slate-600 hover:bg-black/[0.04]'}`}
              >
                <span className={`w-4 h-4 shrink-0 ${view === item.id ? 'text-blue-500' : 'text-blue-400'}`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-2">iCloud</div>
          <div className="flex flex-col gap-0.5">
            {[{ label: 'iCloud Drive', icon: <Icon.Cloud /> }, { label: 'Documents', icon: <Icon.File /> }].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setView('documents')}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors w-full text-left ${view === 'documents' ? 'bg-black/[0.07] text-slate-800 font-medium' : 'text-slate-500 hover:bg-black/[0.04]'}`}
              >
                <span className={`w-4 h-4 shrink-0 ${view === 'documents' ? 'text-blue-500' : 'text-blue-400'}`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Tags</div>
          {[{ label: 'Urgent', color: 'bg-red-500' }, { label: 'Work', color: 'bg-orange-500' }, { label: 'Personal', color: 'bg-green-500' }].map((tag) => (
            <div key={tag.label} className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 cursor-pointer hover:bg-black/[0.04] rounded">
              <div className={`w-2.5 h-2.5 rounded-full ${tag.color}`} />
              {tag.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-white p-6 custom-scroll-macos">

        {/* About Me */}
        {view === 'about' && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-8">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={name} className="w-20 h-20 rounded-full mb-4 shadow-lg object-cover" loading="lazy" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg flex items-center justify-center text-white text-2xl font-bold select-none">
                  {initials}
                </div>
              )}
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">{name}</h1>
              <p className="text-lg text-slate-400 font-medium mb-4">{user.headline || 'Creative Professional'}</p>
              <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
                {sections.about || sections.hero.body || 'Portfolio profile.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setView('contact')}
                  className="bg-slate-900 text-white px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm hover:bg-slate-700 transition-colors"
                >
                  Email Me
                </button>
                {profile.resumeAssetId && (
                  <ResumeDownloadButton
                    subdomain={subdomain}
                    ownerName={name}
                    className="bg-white border border-gray-200 text-slate-700 px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                    label="Download CV"
                  />
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100 mb-6" />

            {sections.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Certifications</h3>
                <div className="flex flex-col gap-2">
                  {sections.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 text-blue-500"><Icon.Star /></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{cert.title}</p>
                        {cert.issuer && <p className="text-xs text-slate-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {view === 'projects' && (
          <div>
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Selected Works</h2>
            {sections.projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <div className="w-10 h-10 mb-3"><Icon.Folder /></div>
                <p className="text-sm">No projects added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sections.projects.map((p, i) => {
                  const acc = PROJECT_ACCENTS[i % PROJECT_ACCENTS.length];
                  const img = p.snapshotUrl || p.imageUrl || p.images?.[0]?.url;
                  return (
                    <a
                      key={i}
                      href={p.url ?? '#'}
                      target={p.url ? '_blank' : '_self'}
                      rel="noreferrer"
                      className="group border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400/50 hover:shadow-md transition-all bg-white block"
                    >
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.title} className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                      ) : (
                        <div className={`w-full aspect-video flex items-center justify-center ${acc.bg}`}>
                          <div className={`w-8 h-8 ${acc.text} opacity-40`}><Icon.Zap /></div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className={`w-9 h-9 rounded-lg ${acc.bg} flex items-center justify-center mb-2 ${acc.text}`}>
                            <div className="w-5 h-5"><Icon.Zap /></div>
                          </div>
                          <div className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors"><Icon.ArrowUpRight /></div>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">{p.title}</h3>
                        {p.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{p.description}</p>}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-medium">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stack */}
        {view === 'stack' && (
          <div>
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Tech Arsenal</h2>
            {sections.skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <div className="w-10 h-10 mb-3"><Icon.Code /></div>
                <p className="text-sm">No skills listed yet.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sections.skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-default">
                    <div className="w-3.5 h-3.5 text-blue-400"><Icon.Code /></div>
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Experience */}
        {view === 'experience' && (
          <div>
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-6">Work History</h2>
            {sections.experience.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <div className="w-10 h-10 mb-3"><Icon.Briefcase /></div>
                <p className="text-sm">No experience added yet.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-0">
                {sections.experience.map((exp, i) => (
                  <div key={i} className="relative pl-6 pb-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-blue-400 rounded-full" />
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{exp.role}</h3>
                        {exp.company && <p className="text-xs text-blue-500 font-medium">{exp.company}</p>}
                      </div>
                      {exp.period && (
                        <span className="text-[10px] text-slate-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{exp.period}</span>
                      )}
                    </div>
                    {exp.summary && <p className="text-xs text-slate-500 leading-relaxed">{exp.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact */}
        {view === 'documents' && (
          <div className="animate-in fade-in duration-200">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Documents</h2>

            {/* Toolbar path */}
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-6 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
              <span className="text-blue-400">☁</span>
              <span>iCloud Drive</span>
              <span>›</span>
              <span className="text-slate-600 font-medium">Documents</span>
            </div>

            {profile.resumeAssetId ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
                {/* Resume PDF file icon */}
                <div className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50/60 cursor-pointer transition-colors select-none"
                  onClick={() => {
                    const btn = document.querySelector<HTMLButtonElement>('[data-resume-download]');
                    btn?.click();
                  }}
                >
                  {/* PDF icon */}
                  <div className="relative w-16 h-20">
                    <svg viewBox="0 0 64 80" fill="none" className="w-full h-full drop-shadow-md">
                      <rect x="2" y="2" width="52" height="66" rx="5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5"/>
                      <path d="M38 2 L54 18 L38 18 Z" fill="#f1f5f9"/>
                      <path d="M38 2 L38 18 L54 18" fill="none" stroke="#e2e8f0" strokeWidth="1.5"/>
                      <rect x="8" y="30" width="42" height="5" rx="2" fill="#ef4444"/>
                      <text x="29" y="35.5" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="700" fontFamily="system-ui">PDF</text>
                      <rect x="8" y="40" width="30" height="2.5" rx="1" fill="#cbd5e1"/>
                      <rect x="8" y="46" width="22" height="2.5" rx="1" fill="#cbd5e1"/>
                    </svg>
                    {/* Cloud badge */}
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center shadow">
                      <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-medium text-center leading-tight group-hover:text-blue-600 transition-colors">
                    {name.split(' ')[0]}_Resume.pdf
                  </span>
                  <span className="text-[10px] text-slate-400">PDF Document</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 text-slate-200 mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p className="text-sm text-slate-400 font-medium">No documents</p>
                <p className="text-xs text-slate-300 mt-1">Link a resume in your portfolio settings to see it here.</p>
              </div>
            )}
          </div>
        )}

        {view === 'contact' && (
          <div>
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-6">Get In Touch</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-md">
              {sections.contact || 'Always open to interesting conversations and collaborations.'}
            </p>
            {profile.resumeAssetId && (
              <div className="mb-5">
                <ResumeDownloadButton subdomain={subdomain} ownerName={name} label="Download CV"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors" />
              </div>
            )}
            <ContactForm
              recipientEmail={contactEmail}
              theme={{
                formClassName: 'space-y-4 max-w-md',
                labelClassName: 'mb-1.5 block text-xs font-medium text-slate-500',
                inputClassName: 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all',
                textareaClassName: 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all',
                buttonClassName: 'w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60',
                successClassName: 'rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700',
                errorClassName: 'mt-1 text-xs text-rose-500',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export function MacOSTemplate({ profile, subdomain }: MacOSTemplateProps) {
  const { user, sections } = profile;
  const name = user.fullName || 'Portfolio Owner';

  // Clock
  const [clock, setClock] = useState('');
  const [clockDate, setClockDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
      setClockDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Finder view
  const [finderView, setFinderView] = useState<FinderView>('about');

  // Z counter for window focus
  const zCounter = useRef(10);

  // Windows
  const INITIAL_WINDOWS: WinState[] = [
    { id: 'finder', title: name, open: true,  minimized: false, maximized: false, x: 60,  y: 40,  w: 760, h: 520, z: 10 },
    { id: 'terminal', title: 'Terminal',       open: false, minimized: false, maximized: false, x: 120, y: 80,  w: 620, h: 400, z: 9  },
    { id: 'safari',   title: 'Projects',       open: false, minimized: false, maximized: false, x: 140, y: 60,  w: 700, h: 480, z: 8  },
    { id: 'vscode',   title: 'VS Code',        open: false, minimized: false, maximized: false, x: 100, y: 70,  w: 720, h: 500, z: 7  },
    { id: 'contact',  title: 'Contact',        open: false, minimized: false, maximized: false, x: 160, y: 90,  w: 600, h: 460, z: 6  },
  ];

  const [windows, setWindows] = useState<WinState[]>(INITIAL_WINDOWS);

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, z } : w));
  }, []);

  const openWindow = useCallback((id: string) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, open: true, minimized: false, z } : w));
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, open: false, minimized: false } : w));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, minimized: true } : w));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, maximized: !w.maximized } : w));
  }, []);

  // Drag
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onTitleBarMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    bringToFront(id);
    const win = windows.find((w) => w.id === id);
    if (!win || win.maximized) return;
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y };
  }, [windows, bringToFront]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { id, sx, sy, ox, oy } = dragRef.current;
      const nx = ox + e.clientX - sx;
      const ny = oy + e.clientY - sy;
      setWindows((prev) => prev.map((w) => w.id === id ? { ...w, x: Math.max(0, nx), y: Math.max(28, ny) } : w));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Dock config
  const dockApps = [
    { id: 'finder' as AppId, label: name, bg: 'from-[#00d6ff] to-[#006aff]', content: <span className="text-2xl">🙂</span> },
    { id: 'safari' as AppId, label: 'Projects', bg: 'from-blue-400 to-blue-600', content: <div className="w-7 h-7 text-white"><Icon.Globe /></div> },
    { id: 'vscode' as AppId, label: 'VS Code', bg: 'bg-[#23a9f2]', content: <div className="w-7 h-7 text-white"><Icon.Code /></div> },
    { id: 'contact' as AppId, label: 'Contact', bg: 'from-[#34c759] to-[#248a3d]', content: <div className="w-7 h-7 text-white"><Icon.Mail /></div> },
    { id: 'terminal' as AppId, label: 'Terminal', bg: 'bg-[#1d1d1f]', content: <span className="text-white font-mono font-bold text-xs">&gt;_</span> },
  ];

  const itemCount = sections.projects.length + sections.skills.length + sections.experience.length;

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#fca5a5',
        backgroundImage: `
          radial-gradient(at 12% 87%, hsla(284,59%,46%,1) 0px, transparent 50%),
          radial-gradient(at 91% 29%, hsla(38,82%,73%,1) 0px, transparent 50%),
          radial-gradient(at 19% 10%, hsla(271,78%,55%,1) 0px, transparent 50%),
          radial-gradient(at 78% 85%, hsla(211,63%,53%,1) 0px, transparent 50%),
          radial-gradient(at 11% 47%, hsla(250,68%,44%,1) 0px, transparent 50%),
          radial-gradient(at 62% 16%, hsla(16,84%,70%,1) 0px, transparent 50%)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        cursor: 'default',
      }}
    >
      <style>{`
        .custom-scroll-macos::-webkit-scrollbar { width: 6px; }
        .custom-scroll-macos::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll-macos::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 20px; }
        .custom-scroll-macos::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }
        .dock-btn { transition: transform 0.18s cubic-bezier(0.175,0.885,0.32,1.275); transform-origin: bottom center; }
        .dock-btn:hover { transform: scale(1.18) translateY(-8px); }
        .win-animate { animation: winOpen 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes winOpen { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform: scale(1); } }
      `}</style>

      {/* ── Menu bar ── */}
      <nav
        className="fixed top-0 left-0 w-full h-7 z-[100] flex items-center justify-between px-4"
        style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-4 text-white text-[13px] font-medium">
          <span className="text-base">🍎</span>
          <span className="font-bold tracking-tight">{name.split(' ')[0]}</span>
          {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((item) => (
            <span key={item} className="hidden sm:inline text-white/80 hover:text-white font-normal cursor-default text-[13px]">{item}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-white text-[12px]">
          <div className="flex items-center gap-2.5 opacity-80">
            <div className="w-[18px] h-[18px]"><Icon.Battery /></div>
            <div className="w-4 h-4"><Icon.Wifi /></div>
            <div className="w-3.5 h-3.5"><Icon.Search /></div>
          </div>
          <span className="font-normal opacity-90">{clockDate}</span>
          <span className="font-medium">{clock}</span>
        </div>
      </nav>

      {/* ── Desktop icons ── */}
      <div className="absolute top-12 right-4 flex flex-col gap-4 z-[5]">
        {/* Hard drive */}
        <div className="w-20 flex flex-col items-center gap-1 cursor-pointer group p-1">
          <div className="w-12 h-12 text-slate-100 drop-shadow-xl group-active:opacity-70 transition-opacity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <span className="text-white text-[11px] font-medium text-center leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Macintosh HD</span>
        </div>
        {/* Resume.pdf */}
        {profile.resumeAssetId && (
          <button type="button"
            onClick={() => {
              const btn = document.querySelector('[data-resume-download]') as HTMLButtonElement | null;
              btn?.click();
            }}
            className="w-20 flex flex-col items-center gap-1 cursor-pointer group p-1"
          >
            <div className="w-10 h-12 bg-white border border-gray-200 rounded-sm shadow-lg relative flex flex-col items-center justify-center group-hover:shadow-xl transition-shadow">
              <span className="text-[8px] font-bold text-red-500 absolute top-1 right-1">PDF</span>
              <div className="w-6 h-px bg-gray-200 mb-1" /><div className="w-6 h-px bg-gray-200 mb-1" /><div className="w-4 h-px bg-gray-200" />
            </div>
            <span className="text-white text-[11px] font-medium text-center leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Resume.pdf</span>
          </button>
        )}
      </div>

      {/* ── Hidden resume trigger ── */}
      {profile.resumeAssetId && (
        <div className="hidden">
          <ResumeDownloadButton subdomain={subdomain} ownerName={name} />
        </div>
      )}

      {/* ── Windows ── */}
      {windows.map((win) => {
        if (!win.open || win.minimized) return null;

        const isMax = win.maximized;
        const style: React.CSSProperties = isMax
          ? { position: 'fixed', top: 28, left: 0, width: '100vw', height: 'calc(100vh - 28px)', zIndex: win.z }
          : { position: 'fixed', top: win.y, left: win.x, width: win.w, height: win.h, zIndex: win.z };

        return (
          <div
            key={win.id}
            className="win-animate flex flex-col overflow-hidden"
            onClick={() => bringToFront(win.id)}
            style={{
              ...style,
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 22px 70px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(255,255,255,0.3) inset',
              borderRadius: 12,
            }}
          >
            {/* Title bar */}
            <div
              className="h-11 flex items-center justify-between px-4 shrink-0 cursor-move"
              style={{ background: 'rgba(240,240,245,0.5)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              onMouseDown={(e) => onTitleBarMouseDown(win.id, e)}
              onDoubleClick={() => maximizeWindow(win.id)}
            >
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-2 group/lights" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                    className="w-3 h-3 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: '#ff5f57', border: '1px solid #e33e32' }}
                  >
                    <span className="text-[7px] font-black text-[#7a150a] opacity-0 group-hover/lights:opacity-100">×</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                    className="w-3 h-3 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: '#febc2e', border: '1px solid #d99d1d' }}
                  >
                    <span className="text-[7px] font-black text-[#7a4a00] opacity-0 group-hover/lights:opacity-100">−</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
                    className="w-3 h-3 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: '#28c840', border: '1px solid #1c9c2b' }}
                  >
                    <span className="text-[7px] font-black text-[#0a4a10] opacity-0 group-hover/lights:opacity-100">{isMax ? '⤡' : '+'}</span>
                  </button>
                </div>

                {/* Nav arrows */}
                <div className="flex items-center gap-1.5 text-slate-400 ml-1">
                  <div className="w-4 h-4"><Icon.ChevronLeft /></div>
                  <div className="w-4 h-4 opacity-30"><Icon.ChevronRight /></div>
                </div>

                <span className="text-sm font-semibold text-slate-700 tracking-tight">{win.title}</span>
              </div>

              {/* Toolbar right */}
              <div className="flex items-center gap-3 text-slate-400" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-4 h-4 hover:text-slate-600 cursor-pointer"><Icon.Grid /></div>
                <div className="w-4 h-4 hover:text-slate-600 cursor-pointer"><Icon.List /></div>
                <div className="flex items-center gap-1.5 bg-white/60 rounded-md px-2 py-1 border border-gray-200/60 shadow-sm">
                  <div className="w-3 h-3 text-slate-400"><Icon.Search /></div>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Search</span>
                </div>
              </div>
            </div>

            {/* Window body */}
            <div className="flex flex-1 overflow-hidden">
              {win.id === 'finder' && <FinderContent profile={profile} subdomain={subdomain} view={finderView} setView={setFinderView} />}
              {win.id === 'terminal' && <TerminalContent profile={profile} />}
              {win.id === 'safari' && <SafariContent profile={profile} />}
              {win.id === 'vscode' && <VSCodeContent profile={profile} />}
              {win.id === 'contact' && <ContactAppContent profile={profile} subdomain={subdomain} />}
            </div>

            {/* Status bar */}
            <div
              className="h-6 flex items-center justify-between px-3 shrink-0"
              style={{ background: 'rgba(240,240,245,0.6)', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 10, color: '#94a3b8' }}
            >
              <span>{itemCount} items</span>
              <span>{win.id === 'finder' ? `${name} · Portfolio` : win.title}</span>
            </div>
          </div>
        );
      })}

      {/* ── Dock ── */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[200] px-2">
        <div
          className="flex items-end gap-2 px-3 pb-2.5 pt-2.5 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.18)',
          }}
        >
          {dockApps.map((app) => {
            const win = windows.find((w) => w.id === app.id);
            const isOpen = win?.open && !win?.minimized;
            const isMin = win?.minimized;
            const isActive = isOpen || isMin;

            return (
              <div key={app.id} className="dock-btn flex flex-col items-center gap-0.5 relative group" title={app.label}>
                <button
                  type="button"
                  onClick={() => {
                    if (!win?.open || win.minimized) { openWindow(app.id); }
                    else if (win.open && !win.minimized) { minimizeWindow(app.id); }
                  }}
                  className={`w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg relative overflow-hidden ring-1 ring-white/10 transition-all bg-gradient-to-b ${app.bg}`}
                >
                  {app.content}
                </button>

                {/* App label tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap backdrop-blur-sm">
                  {app.label}
                </div>

                {/* Active dot */}
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-white/70 absolute -bottom-1" />
                )}
              </div>
            );
          })}

          {/* Separator */}
          <div className="w-px h-10 bg-white/20 mx-0.5 self-center" />

          {/* Trash */}
          <div className="dock-btn flex flex-col items-center gap-0.5 relative group" title="Trash">
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg ring-1 ring-white/10"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
              <div className="w-6 h-6 text-slate-500"><Icon.Trash /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
