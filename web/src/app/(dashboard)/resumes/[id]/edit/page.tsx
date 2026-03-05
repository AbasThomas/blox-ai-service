'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { assetsApi, scannerApi, publishApi } from '@/lib/api';
import { SectionEditor } from '@/components/resume/section-editor';
import {
  Bot, Sparkles, Zap, PlusCircle, CheckCircle, BarChart3,
  RotateCcw, Globe, ExternalLink, X, BriefcaseBusiness, GraduationCap, Users, LayoutTemplate
} from '@/components/ui/icons';
import { ResumeData, ExperienceItem, EducationItem } from '@/components/resume/types';
import { RESUME_TEMPLATES } from '@/components/resume/templates';
import { TemplateSelector } from '@/components/resume/templates/TemplateSelector';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey = 'template' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'contact';
type PageTab = 'edit' | 'publish';

interface VersionRow { id: string; versionLabel: string; createdAt: string }

interface SeoForm {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  ogImagePrompt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<SectionKey, string> = {
  template: 'Design & Template',
  contact: 'Contact Info',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
};

const SECTION_HINTS: Record<SectionKey, string> = {
  template: 'Choose a design that fits your industry and personal style.',
  contact: 'Your contact details and social links.',
  summary: 'A compelling 2–3 sentence professional summary tailored to your target role.',
  experience: 'Add your relevant work history. Use bullet points for achievements.',
  education: 'Your academic background.',
  skills: 'Add relevant technical and soft skills.',
  certifications: 'Add professional certifications.',
};

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  template: <LayoutTemplate className="h-3 w-3" />,
  contact: <Users className="h-3 w-3" />,
  summary: <span className="text-[10px]">✦</span>,
  experience: <BriefcaseBusiness className="h-3 w-3" />,
  education: <GraduationCap className="h-3 w-3" />,
  skills: <span className="text-[10px]">◉</span>,
  certifications: <span className="text-[10px]">★</span>,
};

const DEFAULT_DATA: ResumeData = {
  title: 'My Resume',
  targetRole: '',
  persona: 'job-seeker',
  selectedTemplate: 'ats-tech',
  tailorToJob: false,
  pullFromPortfolio: false,
  jobDesc: '',
  summary: '',
  experience: [],
  skills: [],
  education: [],
  certifications: [],
  contact: { name: '', email: '', phone: '', location: '', linkedin: '', website: '' },
};

const EMPTY_SEO: SeoForm = { title: '', description: '', keywords: '', ogImage: '', ogImagePrompt: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function asStr(v: unknown): string { return typeof v === 'string' ? v : ''; }
function getKeywords(v: unknown): string {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string').join(', ');
  return typeof v === 'string' ? v : '';
}
function normalizeSubdomain(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

const InputField = ({
  label, value, onChange, placeholder, type = 'text', className
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) => (
  <div className={className}>
    <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-white/5 transition-colors"
    />
  </div>
);

// ─── Main Edit Page ───────────────────────────────────────────────────────────

export default function ResumeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // ── Page-level tab ──
  const [pageTab, setPageTab] = useState<PageTab>('edit');

  // ── Edit tab state ──
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ResumeData>(DEFAULT_DATA);
  const [activeSection, setActiveSection] = useState<SectionKey>('summary');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsChecks, setAtsChecks] = useState<Array<{ label: string; passed: boolean; suggestion?: string }>>([]);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [showJobDesc, setShowJobDesc] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // ── Publish tab state ──
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [seoForm, setSeoForm] = useState<SeoForm>(EMPTY_SEO);
  const [seoRaw, setSeoRaw] = useState<Record<string, unknown>>({});
  const [savingSeo, setSavingSeo] = useState(false);
  const [suggestingSeo, setSuggestingSeo] = useState(false);
  const [generatingOg, setGeneratingOg] = useState(false);
  const [seoMsg, setSeoMsg] = useState('');
  const [previewScale, setPreviewScale] = useState(0.65);

  // ── Load ──
  const loadAsset = useCallback(async () => {
    try {
      const asset = await assetsApi.getById(id) as {
        title: string;
        content: Partial<ResumeData>;
        generatingStatus?: string;
        publishedUrl?: string | null;
        slug?: string | null;
        seoConfig?: Record<string, unknown>;
      };
      setTitle(asset.title);
      // Merge with default data to ensure structure
      setContent((prev) => ({ ...DEFAULT_DATA, ...asset.content, contact: { ...DEFAULT_DATA.contact, ...asset.content.contact } }));
      setGeneratingStatus(asset.generatingStatus ?? '');
      setPublishedUrl(asset.publishedUrl ?? null);
      const slug = asStr(asset.slug) || normalizeSubdomain(asset.title);
      if (slug) setSubdomain(slug);
      const raw = toRecord(asset.seoConfig);
      setSeoRaw(raw);
      setSeoForm({
        title: asStr(raw.title),
        description: asStr(raw.description),
        keywords: getKeywords(raw.keywords),
        ogImage: asStr(raw.ogImage),
        ogImagePrompt: asStr(raw.ogImagePrompt),
      });
    } catch { /* ignore */ }
  }, [id]);

  const loadVersions = useCallback(async () => {
    try {
      const rows = await assetsApi.listVersions(id) as VersionRow[];
      setVersions(rows.slice(0, 5));
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { void loadAsset(); void loadVersions(); }, [loadAsset, loadVersions]);

  useEffect(() => {
    if (generatingStatus !== 'processing' && generatingStatus !== 'queued') return;
    const timer = setInterval(() => void loadAsset(), 5000);
    return () => clearInterval(timer);
  }, [generatingStatus, loadAsset]);

  // ── Edit handlers ──
  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await assetsApi.update(id, { title, content });
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await assetsApi.generate(id, jobDesc.trim() || undefined);
      setGeneratingStatus('queued');
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  };

  const handleAtsScore = async () => {
    setScanning(true);
    try {
      const res = await scannerApi.atsScore({ assetId: id }) as { score: number; checks: Array<{ label: string; passed: boolean; suggestion?: string }> };
      setAtsScore(res.score);
      setAtsChecks(res.checks);
    } catch { /* ignore */ }
    finally { setScanning(false); }
  };

  const handleSaveVersion = async () => {
    try {
      await assetsApi.saveVersion(id, { label: new Date().toLocaleString(), content });
      await loadVersions();
    } catch { /* ignore */ }
  };

  const handleRestoreVersion = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      await assetsApi.restoreVersion(id, versionId);
      await loadAsset();
    } catch { /* ignore */ }
    finally { setRestoringId(null); }
  };

  // ── Section updaters ──
  const updateContact = (field: keyof typeof content.contact, val: string) => {
    setContent(prev => ({ ...prev, contact: { ...prev.contact, [field]: val } }));
  };

  const updateExp = (idx: number, field: keyof ExperienceItem, val: any) => {
    setContent(prev => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, experience: next };
    });
  };

  const addExp = () => setContent(prev => ({
    ...prev,
    experience: [...prev.experience, { id: Date.now().toString(), role: '', company: '', startDate: '', endDate: '', current: false, bullets: '' }]
  }));

  const removeExp = (idx: number) => setContent(prev => ({
    ...prev,
    experience: prev.experience.filter((_, i) => i !== idx)
  }));

  const updateEdu = (idx: number, field: keyof EducationItem, val: string) => {
    setContent(prev => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, education: next };
    });
  };

  const addEdu = () => setContent(prev => ({
    ...prev,
    education: [...prev.education, { id: Date.now().toString(), degree: '', institution: '', year: '', gpa: '' }]
  }));

  const removeEdu = (idx: number) => setContent(prev => ({
    ...prev,
    education: prev.education.filter((_, i) => i !== idx)
  }));

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    setContent(prev => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
  };

  const removeSkill = (idx: number) => setContent(prev => ({
    ...prev,
    skills: prev.skills.filter((_, i) => i !== idx)
  }));

  // ── Publish handlers ──
  const handlePublish = async () => {
    const norm = normalizeSubdomain(subdomain);
    if (!norm) { setPublishMsg('Enter a valid subdomain.'); return; }
    setPublishing(true); setPublishMsg('');
    try {
      const res = await publishApi.publish({ assetId: id, subdomain: norm }) as { publishedUrl?: string; subdomain?: string; status?: string };
      const nextSub = normalizeSubdomain(res.subdomain ?? norm);
      setSubdomain(nextSub);
      setPublishedUrl(res.publishedUrl ?? null);
      setPublishMsg(res.status === 'scheduled' ? 'Publish scheduled.' : 'Published successfully.');
    } catch (err) {
      setPublishMsg(err instanceof Error ? err.message : 'Publish failed.');
    } finally { setPublishing(false); }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this resume?')) return;
    setUnpublishing(true); setPublishMsg('');
    try {
      await publishApi.unpublish(id);
      setPublishedUrl(null);
      setPublishMsg('Unpublished.');
    } catch (err) {
      setPublishMsg(err instanceof Error ? err.message : 'Unpublish failed.');
    } finally { setUnpublishing(false); }
  };

  const handleSaveSeo = async () => {
    setSavingSeo(true); setSeoMsg('');
    try {
      const next = {
        ...seoRaw,
        title: seoForm.title.trim(),
        description: seoForm.description.trim(),
        keywords: seoForm.keywords.split(',').map((v) => v.trim()).filter(Boolean),
        ogImage: seoForm.ogImage.trim() || undefined,
        ogImagePrompt: seoForm.ogImagePrompt.trim() || undefined,
      };
      await assetsApi.update(id, { seoConfig: next });
      setSeoRaw(next);
      setSeoMsg('SEO settings saved.');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Could not save SEO settings.');
    } finally { setSavingSeo(false); }
  };

  const handleSuggestSeo = async () => {
    setSuggestingSeo(true); setSeoMsg('');
    try {
      const s = await assetsApi.suggestSeo(id) as { title?: string; description?: string; keywords?: string[]; ogImagePrompt?: string };
      setSeoForm((p) => ({
        ...p,
        title: s.title ?? p.title,
        description: s.description ?? p.description,
        keywords: Array.isArray(s.keywords) ? s.keywords.join(', ') : p.keywords,
        ogImagePrompt: s.ogImagePrompt ?? p.ogImagePrompt,
      }));
      setSeoMsg('SEO suggestions applied.');
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Could not generate suggestions.');
    } finally { setSuggestingSeo(false); }
  };

  const handleGenerateOg = async () => {
    setGeneratingOg(true); setSeoMsg('');
    try {
      const r = await assetsApi.generateOgImage(id) as { ogImage?: string };
      if (r.ogImage) { setSeoForm((p) => ({ ...p, ogImage: r.ogImage ?? '' })); setSeoMsg('OG image URL generated.'); }
    } catch (err) {
      setSeoMsg(err instanceof Error ? err.message : 'Could not generate OG image.');
    } finally { setGeneratingOg(false); }
  };

  // ── Derived ──
  const atsColor = atsScore === null ? '' : atsScore >= 70 ? 'text-emerald-400' : atsScore >= 40 ? 'text-amber-400' : 'text-rose-400';
  const atsBg   = atsScore === null ? '' : atsScore >= 70 ? 'bg-emerald-500'   : atsScore >= 40 ? 'bg-amber-500'   : 'bg-rose-500';
  const sectionKeys = Object.keys(SECTION_LABELS) as SectionKey[];
  const isGenerating = generatingStatus === 'processing' || generatingStatus === 'queued';

  const completionTips = [
    { label: 'Summary written', ok: (content.summary?.replace(/<[^>]+>/g, '').trim() ?? '').length > 50 },
    { label: 'At least 2 experience entries', ok: content.experience.length >= 2 },
    { label: 'At least 5 skills', ok: content.skills.length >= 5 },
    { label: 'Education added', ok: content.education.length > 0 },
  ];
  const completionPct = Math.round((completionTips.filter((t) => t.ok).length / completionTips.length) * 100);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const norm = normalizeSubdomain(subdomain);
    if (!norm) return '';
    if (publishedUrl) {
      try {
        const parsed = new URL(publishedUrl);
        const isLocal = parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost');
        return isLocal ? `${window.location.origin}/${norm}` : parsed.toString();
      } catch { /* fall through */ }
    }
    return `${window.location.origin}/${norm}`;
  }, [publishedUrl, subdomain]);

  const isPublished = !!publishedUrl;
  const Template = RESUME_TEMPLATES[content.selectedTemplate] || RESUME_TEMPLATES['ats-tech'];

  // ── Shared input style ──
  const inputCls = 'w-full rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-white/5 transition-colors';

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ── */}
      <button type="button" onClick={() => router.push('/resumes')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
        ← All Resumes
      </button>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume title"
              className="text-xl font-bold text-white bg-transparent outline-none border-b border-transparent focus:border-white/20 transition-colors placeholder:text-slate-600 min-w-[240px]" />
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
              isPublished ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              {isPublished ? 'Live' : 'Draft'}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">ATS-optimised resume builder with AI assistance.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => void handleSave()} disabled={saving}
            className="rounded-xl border border-white/8 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : saveMsg || 'Save'}
          </button>
        </div>
      </div>

      {/* ── Top-level page tabs ── */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-1.5">
        {([
          { id: 'edit', label: 'Edit' },
          { id: 'publish', label: 'Preview & Publish' },
        ] as { id: PageTab; label: string }[]).map((tab) => (
          <button key={tab.id} type="button" onClick={() => setPageTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              pageTab === tab.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── AI generating banner ── */}
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-3">
          <div className="h-4 w-4 shrink-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <p className="text-xs text-indigo-300">Generating a new version of your resume — this page refreshes automatically.</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          EDIT TAB
      ══════════════════════════════════════════════════════════ */}
      {pageTab === 'edit' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* Editor panel */}
          <div className="space-y-4">
            {/* Section nav */}
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-2">
              {sectionKeys.map((key) => (
                <button key={key} type="button" onClick={() => setActiveSection(key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                    activeSection === key ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <span className="text-[10px]">{SECTION_ICONS[key]}</span>
                  {SECTION_LABELS[key]}
                </button>
              ))}
            </div>

            {/* Section editor */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{SECTION_LABELS[activeSection]}</h3>
                <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{SECTION_HINTS[activeSection]}</p>
              </div>

              {activeSection === 'template' && (
                <div className="pt-2">
                  <TemplateSelector
                    selectedId={content.selectedTemplate}
                    onSelect={(id) => setContent((prev) => ({ ...prev, selectedTemplate: id }))}
                  />
                </div>
              )}

              {activeSection === 'contact' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Full Name" value={content.contact.name} onChange={(v) => updateContact('name', v)} placeholder="Jane Smith" />
                  <InputField label="Email" value={content.contact.email} onChange={(v) => updateContact('email', v)} placeholder="jane@email.com" />
                  <InputField label="Phone" value={content.contact.phone} onChange={(v) => updateContact('phone', v)} placeholder="+1 555 000 0000" />
                  <InputField label="Location" value={content.contact.location} onChange={(v) => updateContact('location', v)} placeholder="San Francisco, CA" />
                  <InputField label="LinkedIn" value={content.contact.linkedin} onChange={(v) => updateContact('linkedin', v)} placeholder="linkedin.com/in/janesmith" />
                  <InputField label="Website" value={content.contact.website} onChange={(v) => updateContact('website', v)} placeholder="janesmith.dev" />
                </div>
              )}

              {activeSection === 'summary' && (
                <SectionEditor content={content.summary} onChange={(html) => setContent(prev => ({ ...prev, summary: html }))}
                  placeholder="A results-driven engineer with 5+ years building scalable web applications..."
                  minHeight="160px" />
              )}

              {activeSection === 'experience' && (
                <div className="space-y-4">
                  {content.experience.map((exp, idx) => (
                    <div key={exp.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Position {idx + 1}</span>
                        <button type="button" onClick={() => removeExp(idx)} className="text-slate-600 hover:text-rose-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField label="Job title" value={exp.role} onChange={(v) => updateExp(idx, 'role', v)} placeholder="Senior Engineer" />
                        <InputField label="Company" value={exp.company} onChange={(v) => updateExp(idx, 'company', v)} placeholder="Acme Corp" />
                        <InputField label="Start date" value={exp.startDate} onChange={(v) => updateExp(idx, 'startDate', v)} placeholder="Jan 2022" />
                        <div>
                          <InputField label="End date" value={exp.endDate} onChange={(v) => updateExp(idx, 'endDate', v)} placeholder="Present" />
                          <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                            <input type="checkbox" checked={exp.current} onChange={(e) => updateExp(idx, 'current', e.target.checked)} className="accent-indigo-500" />
                            Currently working here
                          </label>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-slate-400">Responsibilities & achievements</p>
                        <SectionEditor
                          content={exp.bullets}
                          onChange={(html) => updateExp(idx, 'bullets', html)}
                          placeholder="• Led a team of 5 engineers..."
                          minHeight="90px"
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addExp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors">
                    <PlusCircle className="h-4 w-4" /> Add Position
                  </button>
                </div>
              )}

              {activeSection === 'education' && (
                <div className="space-y-4">
                  {content.education.map((edu, idx) => (
                    <div key={edu.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Entry {idx + 1}</span>
                        <button type="button" onClick={() => removeEdu(idx)} className="text-slate-600 hover:text-rose-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField label="Degree" value={edu.degree} onChange={(v) => updateEdu(idx, 'degree', v)} placeholder="B.Sc. Computer Science" />
                        <InputField label="Institution" value={edu.institution} onChange={(v) => updateEdu(idx, 'institution', v)} placeholder="MIT" />
                        <InputField label="Year" value={edu.year} onChange={(v) => updateEdu(idx, 'year', v)} placeholder="2020" />
                        <InputField label="GPA" value={edu.gpa} onChange={(v) => updateEdu(idx, 'gpa', v)} placeholder="3.8" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addEdu}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors">
                    <PlusCircle className="h-4 w-4" /> Add Education
                  </button>
                </div>
              )}

              {activeSection === 'skills' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {content.skills.map((sk, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                        {sk}
                        <button type="button" onClick={() => removeSkill(idx)} className="text-slate-500 hover:text-rose-400 transition-colors"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Type a skill and press Enter..."
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Fallback for certifications if not implemented fully yet */}
              {activeSection === 'certifications' && (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-slate-500">
                  Certifications editing coming soon.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">

            {/* ATS Score */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400">ATS Score</h3>
                {atsScore !== null && <span className="text-xs font-medium text-slate-500">{atsChecks.filter((c) => c.passed).length}/{atsChecks.length} checks</span>}
              </div>
              {atsScore !== null ? (
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <p className={`text-4xl font-black leading-none ${atsColor}`}>{atsScore}</p>
                    <span className="text-xs text-slate-500 pb-1">/ 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${atsBg}`} style={{ width: `${atsScore}%` }} />
                  </div>
                  <p className={`text-[11px] font-medium ${atsColor}`}>
                    {atsScore >= 70 ? 'Strong — keep polishing' : atsScore >= 40 ? 'Getting there' : 'Needs work'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">Run a scan to see how your resume scores against ATS systems.</p>
              )}
              <button type="button" onClick={() => void handleAtsScore()} disabled={scanning}
                className="w-full rounded-xl border border-white/8 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60 transition-colors">
                {scanning ? 'Scanning...' : 'Run ATS Scan'}
              </button>
            </div>

            {/* ATS checks */}
            {atsChecks.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-400">Checks</h3>
                <ul className="space-y-2">
                  {atsChecks.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`mt-0.5 text-xs shrink-0 ${c.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{c.passed ? '✓' : '✗'}</span>
                      <div className="min-w-0">
                        <p className={`text-xs ${c.passed ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>{c.label}</p>
                        {!c.passed && c.suggestion && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{c.suggestion}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Assistant */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <h3 className="text-xs font-semibold text-slate-300">AI Assistant</h3>
                {isGenerating && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                    <span className="text-[10px] text-indigo-300">Generating…</span>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => void handleGenerate()} disabled={generating || isGenerating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/15 disabled:opacity-60 transition-all">
                <Bot className="h-3.5 w-3.5" />
                {generating ? 'Queuing...' : 'Re-generate Content'}
              </button>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <button type="button" onClick={() => setShowJobDesc((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-amber-400" />Tailor to a Job</span>
                  <span className="text-slate-600 text-[10px]">{showJobDesc ? '▲' : '▼'}</span>
                </button>
                {showJobDesc && (
                  <div className="px-3 pb-3 space-y-2">
                    <textarea rows={4} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
                      placeholder="Paste the job description here..."
                      className="w-full resize-none rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-slate-600 leading-relaxed" />
                    <button type="button" onClick={() => void handleGenerate()} disabled={generating || !jobDesc.trim() || isGenerating}
                      className="w-full rounded-lg bg-amber-500/15 border border-amber-500/25 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 disabled:opacity-50 transition-all">
                      {generating ? 'Processing...' : 'Tailor & Regenerate'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Version & actions */}
            <div className="space-y-2">
              <button type="button" onClick={() => void handleSaveVersion()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/8 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors">
                <PlusCircle className="h-3.5 w-3.5" /> Save Version
              </button>
              <button type="button" onClick={() => router.push(`/analytics/${id}`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/8 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors">
                <BarChart3 className="h-3.5 w-3.5" /> View Analytics
              </button>
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
                <button type="button" onClick={() => setShowVersions((v) => !v)}
                  className="flex w-full items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                  <span>Version History</span>
                  <span className="text-[10px] text-slate-600">{showVersions ? '▲' : '▼'} {versions.length}</span>
                </button>
                {showVersions && (
                  <ul className="space-y-1.5 pt-1">
                    {versions.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-slate-300">{v.versionLabel}</p>
                          <p className="text-[10px] text-slate-600">{new Date(v.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button type="button" onClick={() => void handleRestoreVersion(v.id)} disabled={restoringId === v.id}
                          title="Restore this version"
                          className="shrink-0 rounded-lg border border-white/8 p-1.5 text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 disabled:opacity-50 transition-all">
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Completeness */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400">Completeness</h3>
                <span className={`text-xs font-bold ${completionPct === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>{completionPct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/8">
                <div className={`h-1 rounded-full transition-all duration-500 ${completionPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${completionPct}%` }} />
              </div>
              <ul className="space-y-1.5">
                {completionTips.map((tip) => (
                  <li key={tip.label} className="flex items-center gap-2">
                    <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${tip.ok ? 'text-emerald-400' : 'text-slate-700'}`} />
                    <span className={`text-xs ${tip.ok ? 'text-slate-300' : 'text-slate-600'}`}>{tip.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PREVIEW & PUBLISH TAB
      ══════════════════════════════════════════════════════════ */}
      {pageTab === 'publish' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">

          {/* Left — A4 resume preview */}
          <div className="space-y-4">
            {/* Preview toolbar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
              <span className="text-xs font-medium text-slate-400">Zoom</span>
              {([['50%', 0.5], ['65%', 0.65], ['80%', 0.8], ['100%', 1.0]] as [string, number][]).map(([label, scale]) => (
                <button key={label} type="button" onClick={() => setPreviewScale(scale)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    previewScale === scale ? 'bg-indigo-500 text-white' : 'border border-white/10 text-slate-400 hover:bg-white/5'
                  }`}>
                  {label}
                </button>
              ))}
              {isPublished && publicUrl && (
                <a href={publicUrl} target="_blank" rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-colors">
                  <ExternalLink className="h-3 w-3" /> Open live page
                </a>
              )}
            </div>

            {/* A4 canvas */}
            <div className="overflow-auto rounded-2xl border border-white/5 bg-[#0a0a0f] p-6">
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: `${210 * previewScale}mm`, height: `${297 * previewScale}mm` }}>
                <Template data={content} />
              </div>
            </div>
          </div>

          {/* Right — Publish + SEO sidebar */}
          <aside className="space-y-4">

            {/* Publish settings */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">Publish</h3>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  isPublished ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  {isPublished ? 'Live' : 'Draft'}
                </span>
              </div>

              {/* Subdomain */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Public URL</label>
                <div className="flex items-center overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
                  <input value={subdomain} onChange={(e) => setSubdomain(normalizeSubdomain(e.target.value))}
                    placeholder="my-resume"
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:outline-none" />
                  <span className="border-l border-white/8 px-3 py-2.5 text-xs text-slate-500 shrink-0">.blox.app</span>
                </div>
              </div>

              <button type="button" onClick={() => void handlePublish()} disabled={publishing}
                className="w-full rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-60 transition-colors">
                {publishing ? 'Publishing...' : isPublished ? 'Re-publish' : 'Publish Now'}
              </button>

              {isPublished && (
                <button type="button" onClick={() => void handleUnpublish()} disabled={unpublishing}
                  className="w-full rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 disabled:opacity-60 transition-colors">
                  {unpublishing ? 'Unpublishing...' : 'Unpublish'}
                </button>
              )}

              {isPublished && publicUrl && (
                <a href={publicUrl} target="_blank" rel="noreferrer"
                  className="block break-all rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/12 transition-colors">
                  {publicUrl}
                </a>
              )}

              {publishMsg && <p className="text-xs text-slate-300">{publishMsg}</p>}
            </div>

            {/* Export */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Export</h3>
              <button type="button"
                onClick={() => {
                  const w = window.open('', '_blank');
                  // We can't use innerHTML easily with React components in the new structure.
                  // For now, we can try to print the window directly or use a specific print library.
                  // Or just tell the user to use browser print.
                  // The previous implementation used document.querySelector('.resume-doc-preview')?.innerHTML.
                  // Since we are now using a real component inside a div, we can try to grab that div.
                  // But styles might be lost if not inline.
                  // The new templates use Tailwind classes which might not be present in the new window unless we inject styles.
                  // For now, let's just trigger print on current window or a simplified version.
                  window.print();
                }}
                className="w-full rounded-xl border border-white/8 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors">
                Print / Save as PDF
              </button>
              <p className="text-[11px] text-slate-600 leading-relaxed">Opens print dialog. Ensure "Background graphics" is enabled in print settings.</p>
            </div>

            {/* SEO metadata */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">SEO Metadata</h3>
                <button type="button" onClick={() => void handleSuggestSeo()} disabled={suggestingSeo}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-60 transition-colors">
                  {suggestingSeo ? 'Generating…' : '✦ Auto-fill'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Title</label>
                  <input value={seoForm.title} onChange={(e) => setSeoForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Jane Smith — Senior Frontend Engineer" />
                  <p className="mt-1 text-[10px] text-slate-600">{seoForm.title.length}/60 chars</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
                  <textarea rows={3} value={seoForm.description} onChange={(e) => setSeoForm((p) => ({ ...p, description: e.target.value }))}
                    className={`${inputCls} resize-none`} placeholder="Results-driven engineer with 5+ years..." />
                  <p className="mt-1 text-[10px] text-slate-600">{seoForm.description.length}/160 chars</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Keywords</label>
                  <input value={seoForm.keywords} onChange={(e) => setSeoForm((p) => ({ ...p, keywords: e.target.value }))} className={inputCls} placeholder="React, TypeScript, Node.js, remote" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">OG Image prompt</label>
                  <textarea rows={2} value={seoForm.ogImagePrompt} onChange={(e) => setSeoForm((p) => ({ ...p, ogImagePrompt: e.target.value }))}
                    className={`${inputCls} resize-none`} placeholder="Professional headshot with dark background…" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-400">OG Image URL</label>
                    <button type="button" onClick={() => void handleGenerateOg()} disabled={generatingOg}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 disabled:opacity-60 transition-colors">
                      {generatingOg ? 'Generating…' : 'Generate'}
                    </button>
                  </div>
                  <input value={seoForm.ogImage} onChange={(e) => setSeoForm((p) => ({ ...p, ogImage: e.target.value }))} className={inputCls} placeholder="https://..." />
                </div>
              </div>

              <button type="button" onClick={() => void handleSaveSeo()} disabled={savingSeo}
                className="w-full rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-60 transition-colors">
                {savingSeo ? 'Saving...' : 'Save SEO Settings'}
              </button>
              {seoMsg && <p className="text-xs text-slate-400">{seoMsg}</p>}
            </div>

          </aside>
        </div>
      )}
    </div>
  );
}
