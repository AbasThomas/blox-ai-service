'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetType } from '@nextjs-blox/shared-types';
import { assetsApi, scannerApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { SectionEditor } from './section-editor';
import {
  FileText,
  ArrowUpRight,
  CheckCircle,
  Sparkles,
  X,
  PlusCircle,
  Target,
  BriefcaseBusiness,
  Users,
  GraduationCap,
} from '@/components/ui/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string;
}

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  gpa: string;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

interface ResumeData {
  title: string;
  targetRole: string;
  persona: string;
  selectedTemplate: string;
  tailorToJob: boolean;
  pullFromPortfolio: boolean;
  jobDesc: string;
  summary: string;
  experience: ExperienceItem[];
  skills: string[];
  education: EducationItem[];
  contact: ContactInfo;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'ats-tech', name: 'Tech ATS Pro', category: 'tech', badge: 'ATS 98%', accent: 'bg-blue-500/20 text-blue-300 border-blue-500/20', preview: ['h-2 w-3/4', 'h-1.5 w-1/2', 'h-8 w-full', 'h-1.5 w-2/3', 'h-1.5 w-3/4'] },
  { id: 'classic', name: 'Classic Pro', category: 'general', badge: 'Traditional', accent: 'bg-slate-500/20 text-slate-300 border-slate-500/20', preview: ['h-2 w-1/2 mx-auto', 'h-1.5 w-1/3 mx-auto', 'h-px w-full', 'h-1.5 w-3/4', 'h-1.5 w-2/3'] },
  { id: 'modern', name: 'Modern Minimal', category: 'general', badge: 'Popular', accent: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20', preview: ['h-3 w-1/2', 'h-1.5 w-1/3', 'h-1.5 w-full', 'h-1.5 w-5/6', 'h-1.5 w-4/6'] },
  { id: 'creative', name: 'Creative Portfolio', category: 'design', badge: 'Visual', accent: 'bg-purple-500/20 text-purple-300 border-purple-500/20', preview: ['h-full w-1/3 float-left', 'h-2 w-1/2', 'h-1.5 w-2/3', 'h-1.5 w-1/2', 'h-1.5 w-3/4'] },
  { id: 'executive', name: 'Executive Suite', category: 'executive', badge: 'Senior', accent: 'bg-amber-500/20 text-amber-300 border-amber-500/20', preview: ['h-2.5 w-2/3', 'h-1.5 w-1/2', 'h-px w-full', 'h-1.5 w-full', 'h-1.5 w-5/6'] },
  { id: 'academic', name: 'Academic CV', category: 'academic', badge: 'Research', accent: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20', preview: ['h-2 w-2/3 mx-auto', 'h-1.5 w-1/2 mx-auto', 'h-1.5 w-full', 'h-1.5 w-3/4', 'h-1.5 w-full'] },
  { id: 'freelance', name: 'Freelance Consult', category: 'freelance', badge: 'Self-Employed', accent: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20', preview: ['h-2 w-1/2', 'h-1.5 w-1/3', 'h-6 w-full rounded', 'h-1.5 w-5/6', 'h-1.5 w-2/3'] },
  { id: 'entry', name: 'Fresh Graduate', category: 'entry', badge: 'Entry Level', accent: 'bg-rose-500/20 text-rose-300 border-rose-500/20', preview: ['h-2 w-2/3', 'h-1.5 w-1/2', 'h-1.5 w-full', 'h-1.5 w-3/4', 'h-1.5 w-4/6'] },
];

const PERSONAS = [
  { id: 'job-seeker', label: 'Job Seeker', icon: Target, desc: 'Traditional employment' },
  { id: 'freelancer', label: 'Freelancer', icon: BriefcaseBusiness, desc: 'Independent contractor' },
  { id: 'executive', label: 'Executive', icon: Users, desc: 'Senior leadership' },
  { id: 'academic', label: 'Academic', icon: GraduationCap, desc: 'Research / teaching' },
];

const STEP_LABELS = ['Template', 'Content', 'Optimize', 'Review'];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  'job-seeker': ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability'],
  freelancer: ['Client Management', 'Project Management', 'Self-motivated', 'Negotiation'],
  executive: ['Strategic Leadership', 'P&L Management', 'Stakeholder Engagement', 'Vision'],
  academic: ['Research Methods', 'Academic Writing', 'Grant Writing', 'Peer Review'],
};

// Dynamic tips — shown in Step 3 based on what's missing
const SCORE_TIPS = [
  { id: 'summary', check: (d: ResumeData) => d.summary.replace(/<[^>]+>/g, '').trim().length > 30, tip: 'Add a 2–3 sentence professional summary.' },
  { id: 'exp', check: (d: ResumeData) => d.experience.length >= 2, tip: 'Include at least 2 work experience entries.' },
  { id: 'skills', check: (d: ResumeData) => d.skills.length >= 5, tip: 'List at least 5 relevant skills.' },
  { id: 'edu', check: (d: ResumeData) => d.education.length >= 1, tip: 'Include your highest level of education.' },
  { id: 'contact', check: (d: ResumeData) => !!(d.contact.name && d.contact.email), tip: 'Complete your name and email address.' },
  { id: 'job', check: (d: ResumeData) => d.jobDesc.trim().length > 20, tip: 'Paste a job description to unlock AI keyword matching.' },
];

const DRAFT_KEY = 'blox_resume_wizard_draft';

// ─── ATS Score Calculator ─────────────────────────────────────────────────────

function calcAtsScore(data: ResumeData): number {
  let score = 0;
  if (data.summary && data.summary.replace(/<[^>]+>/g, '').trim().length > 30) score += 20;
  if (data.experience.length >= 1) score += 15;
  if (data.experience.length >= 2) score += 10;
  if (data.skills.length >= 5) score += 15;
  if (data.education.length >= 1) score += 10;
  if (data.contact.name && data.contact.email) score += 10;
  if (data.contact.phone) score += 5;
  if (data.contact.linkedin) score += 5;
  if (data.jobDesc.trim().length > 20) score += 10;
  return Math.min(score, 100);
}

// ─── Resume Preview ───────────────────────────────────────────────────────────

function ResumePreview({ data, scale = 1 }: { data: ResumeData; scale?: number }) {
  const skillsText = data.skills.filter(Boolean).join(' · ');

  return (
    <div
      className="origin-top-left overflow-hidden rounded-lg border border-white/10 bg-white font-serif text-[#1a1a1a] shadow-2xl"
      style={{ width: `${210 * scale}px`, minHeight: `${297 * scale}px`, fontSize: `${11 * scale}px` }}
    >
      {/* Header */}
      <div className="border-b-2 border-[#1a1a1a]" style={{ padding: `${20 * scale}px ${24 * scale}px` }}>
        <h1 className="font-sans font-bold text-[#1a1a1a]" style={{ fontSize: `${20 * scale}px`, lineHeight: 1.2 }}>
          {data.contact.name || data.title || 'Your Name'}
        </h1>
        {data.targetRole && (
          <p className="font-sans font-medium text-[#555]" style={{ fontSize: `${11 * scale}px`, marginTop: `${4 * scale}px` }}>
            {data.targetRole}
          </p>
        )}
        <div className="flex flex-wrap gap-x-3 font-sans text-[#666]" style={{ fontSize: `${9 * scale}px`, marginTop: `${6 * scale}px` }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
          {data.contact.location && <span>{data.contact.location}</span>}
          {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
        </div>
      </div>

      <div style={{ padding: `${14 * scale}px ${24 * scale}px`, gap: `${14 * scale}px`, display: 'flex', flexDirection: 'column' }}>
        {data.summary && (
          <section>
            <h2 className="font-sans font-bold uppercase tracking-wider" style={{ fontSize: `${9 * scale}px`, borderBottom: `1px solid #ccc`, paddingBottom: `${3 * scale}px`, marginBottom: `${6 * scale}px` }}>
              Professional Summary
            </h2>
            <div className="text-[#333] leading-relaxed" dangerouslySetInnerHTML={{ __html: data.summary }} style={{ fontSize: `${10 * scale}px` }} />
          </section>
        )}
        {data.experience.length > 0 && (
          <section>
            <h2 className="font-sans font-bold uppercase tracking-wider" style={{ fontSize: `${9 * scale}px`, borderBottom: `1px solid #ccc`, paddingBottom: `${3 * scale}px`, marginBottom: `${6 * scale}px` }}>
              Experience
            </h2>
            {data.experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: `${8 * scale}px` }}>
                <div className="flex justify-between font-sans font-semibold" style={{ fontSize: `${10 * scale}px` }}>
                  <span>{exp.role}</span>
                  <span className="text-[#555]">{exp.startDate}{exp.endDate ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</span>
                </div>
                <p className="font-sans italic text-[#555]" style={{ fontSize: `${9 * scale}px` }}>{exp.company}</p>
                {exp.bullets && <div className="mt-1 text-[#333]" dangerouslySetInnerHTML={{ __html: exp.bullets }} style={{ fontSize: `${9.5 * scale}px` }} />}
              </div>
            ))}
          </section>
        )}
        {skillsText && (
          <section>
            <h2 className="font-sans font-bold uppercase tracking-wider" style={{ fontSize: `${9 * scale}px`, borderBottom: `1px solid #ccc`, paddingBottom: `${3 * scale}px`, marginBottom: `${6 * scale}px` }}>
              Skills
            </h2>
            <p className="text-[#333]" style={{ fontSize: `${10 * scale}px`, lineHeight: 1.6 }}>{skillsText}</p>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="font-sans font-bold uppercase tracking-wider" style={{ fontSize: `${9 * scale}px`, borderBottom: `1px solid #ccc`, paddingBottom: `${3 * scale}px`, marginBottom: `${6 * scale}px` }}>
              Education
            </h2>
            {data.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: `${6 * scale}px` }}>
                <div className="flex justify-between font-sans font-semibold" style={{ fontSize: `${10 * scale}px` }}>
                  <span>{edu.degree}</span>
                  <span className="text-[#555]">{edu.year}</span>
                </div>
                <p className="font-sans italic text-[#555]" style={{ fontSize: `${9 * scale}px` }}>{edu.institution}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

// ─── ATS Score Ring ───────────────────────────────────────────────────────────

function AtsScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="54" cy="54" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="54" y="50" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="sans-serif">{score}</text>
        <text x="54" y="66" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">ATS Score</text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>
        {score >= 80 ? 'Excellent' : score >= 60 ? 'Good — keep editing' : 'Needs improvement'}
      </span>
    </div>
  );
}

// ─── Mini ATS bar (compact, for Step 2 sidebar) ───────────────────────────────

function MiniAtsBar({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400';
  const barColor = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">ATS Readiness</span>
        <span className={`text-sm font-black ${color}`}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <p className={`text-[11px] ${color}`}>
        {score >= 70 ? 'Looking strong' : score >= 40 ? 'Getting there' : 'Keep adding content'}
      </p>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-indigo-500' : 'bg-white/10'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const DEFAULT_DATA: ResumeData = {
  title: 'My Resume',
  targetRole: '',
  persona: 'job-seeker',
  selectedTemplate: 'ats-tech',
  tailorToJob: false,
  pullFromPortfolio: true,
  jobDesc: '',
  summary: '',
  experience: [],
  skills: [],
  education: [],
  contact: { name: '', email: '', phone: '', location: '', linkedin: '', website: '' },
};

export function ResumeWizard() {
  const router = useRouter();
  const userName = useBloxStore((s) => s.user.name);
  const userEmail = useBloxStore((s) => s.user.email ?? '');

  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResumeData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) return { ...DEFAULT_DATA, ...(JSON.parse(raw) as Partial<ResumeData>) };
      } catch { /* ignore */ }
    }
    return { ...DEFAULT_DATA, contact: { ...DEFAULT_DATA.contact, name: userName ?? '', email: userEmail } };
  });

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string>('summary');
  const [exported, setExported] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioHint, setPortfolioHint] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate contact from user store on first load ──
  useEffect(() => {
    if (!data.contact.name && userName) {
      setData((d) => ({ ...d, contact: { ...d.contact, name: userName, email: userEmail } }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save to localStorage ──
  const persistDraft = useCallback((next: ResumeData) => {
    if (typeof window === 'undefined') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setTimeout(() => setSaving(false), 800);
    }, 1500);
  }, []);

  const update = useCallback(<K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      persistDraft(next);
      return next;
    });
  }, [persistDraft]);

  // ── Portfolio pre-fill ──
  const applyPortfolioPrefill = useCallback(async () => {
    setPortfolioLoading(true);
    setPortfolioHint('');
    try {
      // Step 1: list to find the most recent portfolio (list omits content for perf)
      const portfolios = await assetsApi.list('PORTFOLIO') as Array<{ id: string; title: string }>;
      const first = Array.isArray(portfolios) ? portfolios[0] : undefined;

      if (!first) {
        setPortfolioHint('No portfolio found — fill in manually below.');
        update('pullFromPortfolio', false);
        return;
      }

      // Step 2: fetch full asset to get content
      const full = await assetsApi.getById(first.id) as {
        id: string;
        title: string;
        content?: {
          about?: string;
          skills?: string[];
          experience?: string[];
          heroHeading?: string;
          heroBody?: string;
        };
      };

      const c = full.content ?? {};

      setData((prev) => {
        const next: ResumeData = { ...prev };
        if (c.about?.trim()) next.summary = c.about;
        if (Array.isArray(c.skills) && c.skills.length > 0) next.skills = c.skills;
        if (Array.isArray(c.experience) && c.experience.length > 0) {
          next.experience = c.experience.map((item, i) => ({
            id: `${Date.now()}-${i}`,
            role: '',
            company: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: item,
          }));
        }
        persistDraft(next);
        return next;
      });

      setPortfolioHint(`Pre-filled from "${full.title}". Review and adjust each section.`);
    } catch (err) {
      setPortfolioHint(
        err instanceof Error && err.message
          ? `Could not load portfolio: ${err.message}`
          : 'Could not load portfolio — fill in manually below.',
      );
      update('pullFromPortfolio', false);
    } finally {
      setPortfolioLoading(false);
    }
  }, [persistDraft, update]);

  const atsScore = calcAtsScore(data);

  // ── Experience helpers ──
  const addExperience = () => {
    update('experience', [...data.experience, { id: Date.now().toString(), role: '', company: '', startDate: '', endDate: '', current: false, bullets: '' }]);
  };
  const updateExp = (id: string, field: keyof ExperienceItem, value: string | boolean) => {
    update('experience', data.experience.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };
  const removeExp = (id: string) => update('experience', data.experience.filter((e) => e.id !== id));

  // ── Education helpers ──
  const addEducation = () => {
    update('education', [...data.education, { id: Date.now().toString(), degree: '', institution: '', year: '', gpa: '' }]);
  };
  const updateEdu = (id: string, field: keyof EducationItem, value: string) => {
    update('education', data.education.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };
  const removeEdu = (id: string) => update('education', data.education.filter((e) => e.id !== id));

  // ── Skills helpers ──
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || data.skills.includes(trimmed)) return;
    update('skills', [...data.skills, trimmed]);
    setSkillInput('');
  };
  const removeSkill = (skill: string) => update('skills', data.skills.filter((s) => s !== skill));

  // ── Run ATS scan (Step 3 button) ──
  const runAiScan = async () => {
    setAiLoading(true);
    try {
      await scannerApi.atsScore({ content: data.summary, jobDesc: data.jobDesc });
    } catch { /* score is computed locally */ }
    await new Promise((r) => setTimeout(r, 900));
    setAiLoading(false);
  };

  // ── Final create ──
  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const created = await assetsApi.create({
        type: AssetType.RESUME,
        title: data.title,
        metadata: {
          targetRole: data.targetRole,
          template: data.selectedTemplate,
          contact: data.contact,
          summary: data.summary,
          experience: data.experience,
          skills: data.skills,
          education: data.education,
        },
      }) as { id: string };
      localStorage.removeItem(DRAFT_KEY);
      setExported(true);
      setTimeout(() => router.push(`/resumes/${created.id}/edit`), 1600);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create résumé.');
    } finally {
      setCreating(false);
    }
  };

  // Computed pending tips for Step 3
  const pendingTips = SCORE_TIPS.filter((t) => !t.check(data)).slice(0, 3);

  // ── Input helper ──
  const InputField = ({
    label, value, onChange, placeholder, type = 'text',
  }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
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

  // ─────────────────────────────────────────────────────────────────────────
  // ── LAYOUT ──
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full">
      {/* ── Progress header ── */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <button type="button" onClick={() => router.push('/resumes')}
            className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
            ← All Résumés
          </button>
          <div className="flex items-center gap-2">
            {saving && <span className="text-[10px] text-slate-500">Saving draft…</span>}
            <button type="button" onClick={() => { localStorage.removeItem(DRAFT_KEY); router.push('/resumes'); }}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
              Discard
            </button>
          </div>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <button
                key={label}
                type="button"
                onClick={() => num < step && setStep(num)}
                disabled={num > step}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  active ? 'bg-purple-500 text-white' : done ? 'cursor-pointer bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : done ? 'bg-purple-400/30' : 'bg-white/10'}`}>
                  {done ? '✓' : num}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
          <div className="ml-auto text-xs text-slate-500">Step {step} of 4</div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 w-full rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-purple-500"
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* ── Step content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >

          {/* ═══════════════════════════════════════════════════
              STEP 1 — Template & Intent
          ═══════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Left */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-bold text-white">Create your résumé</h1>
                  <p className="mt-1 text-sm text-slate-400">Choose a template and set your intent — we'll handle the rest.</p>
                </div>

                <InputField label="Résumé title" value={data.title} onChange={(v) => update('title', v)} placeholder="e.g. Senior Engineer Resume" />
                <InputField label="Target role" value={data.targetRole} onChange={(v) => update('targetRole', v)} placeholder="e.g. Senior Frontend Engineer" />

                {/* Persona */}
                <div>
                  <p className="mb-3 text-xs font-medium text-slate-400">Your profile type</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PERSONAS.map((p) => {
                      const Icon = p.icon;
                      const active = data.persona === p.id;
                      return (
                        <button key={p.id} type="button" onClick={() => update('persona', p.id)}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all ${
                            active
                              ? 'border-indigo-500/40 bg-indigo-500/10 text-white'
                              : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-200'
                          }`}>
                          <Icon className={`h-5 w-5 ${active ? 'text-indigo-300' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold leading-tight">{p.label}</span>
                          <span className="text-[10px] text-slate-500 leading-tight">{p.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Template grid */}
                <div>
                  <p className="mb-3 text-xs font-medium text-slate-400">Template</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TEMPLATES.map((t) => (
                      <button key={t.id} type="button" onClick={() => update('selectedTemplate', t.id)}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                          data.selectedTemplate === t.id ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : 'border-white/5 hover:border-white/15'
                        }`}>
                        <div className="flex h-24 flex-col gap-1.5 bg-white p-3">
                          {t.preview.map((cls, i) => (
                            <div key={i} className={`rounded-full bg-slate-300 ${cls}`} />
                          ))}
                        </div>
                        <div className="bg-[#0C0F13] px-2 py-2">
                          <p className="truncate text-[11px] font-semibold text-slate-200">{t.name}</p>
                          <span className={`mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${t.accent}`}>{t.badge}</span>
                        </div>
                        {data.selectedTemplate === t.id && (
                          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  {/* Pull from portfolio */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Pull from Portfolio</p>
                        <p className="mt-0.5 text-xs text-slate-500">Auto-fill your summary, skills, and experience from an existing portfolio.</p>
                      </div>
                      <Toggle
                        checked={data.pullFromPortfolio}
                        onChange={() => {
                          const next = !data.pullFromPortfolio;
                          update('pullFromPortfolio', next);
                          if (next) void applyPortfolioPrefill();
                        }}
                      />
                    </div>
                    {portfolioLoading && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <div className="h-3 w-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                        Loading from portfolio…
                      </div>
                    )}
                    {portfolioHint && !portfolioLoading && (
                      <div className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                        portfolioHint.startsWith('No') || portfolioHint.startsWith('Could')
                          ? 'border-amber-500/20 bg-amber-500/8 text-amber-300'
                          : 'border-indigo-500/20 bg-indigo-500/8 text-indigo-300'
                      }`}>
                        {portfolioHint.startsWith('No') || portfolioHint.startsWith('Could') ? '⚠ ' : '✦ '}{portfolioHint}
                      </div>
                    )}
                  </div>

                  {/* Tailor to job */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Tailor to a Job</p>
                        <p className="mt-0.5 text-xs text-slate-500">Paste a job description — AI will match keywords in Step 3.</p>
                      </div>
                      <Toggle
                        checked={data.tailorToJob}
                        onChange={() => update('tailorToJob', !data.tailorToJob)}
                      />
                    </div>
                    <AnimatePresence>
                      {data.tailorToJob && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <textarea value={data.jobDesc} onChange={(e) => update('jobDesc', e.target.value)}
                            placeholder="Paste the full job description here…"
                            rows={5}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 resize-none transition-colors" />
                          {data.jobDesc.trim().length > 20 && (
                            <p className="mt-1.5 text-[11px] text-indigo-400/80">✦ Keywords will be matched in Step 3.</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right — preview */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  <p className="mb-3 text-xs font-medium text-slate-400">Preview</p>
                  <ResumePreview data={data} scale={0.55} />
                  <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                    <p className="text-xs font-semibold text-indigo-300">What happens next</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {data.pullFromPortfolio
                        ? 'Step 2 will be pre-filled from your portfolio — just review and refine.'
                        : 'In Step 2 you\u2019ll fill in your experience, skills, and education.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2 — Refine Content
          ═══════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
              {/* Left — Accordion sections */}
              <div className="space-y-3">
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white">Refine your content</h1>
                  <p className="mt-1 text-sm text-slate-400">Review each section. Pre-filled fields are marked — adjust freely.</p>
                </div>

                {/* Contact */}
                <AccordionSection title="Contact Information" isOpen={openAccordion === 'contact'} onToggle={() => setOpenAccordion(openAccordion === 'contact' ? '' : 'contact')} badge={data.contact.name ? '✓' : undefined}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InputField label="Full name" value={data.contact.name} onChange={(v) => update('contact', { ...data.contact, name: v })} placeholder="Jane Smith" />
                    <InputField label="Email" value={data.contact.email} onChange={(v) => update('contact', { ...data.contact, email: v })} placeholder="jane@email.com" type="email" />
                    <InputField label="Phone" value={data.contact.phone} onChange={(v) => update('contact', { ...data.contact, phone: v })} placeholder="+1 555 000 0000" />
                    <InputField label="Location" value={data.contact.location} onChange={(v) => update('contact', { ...data.contact, location: v })} placeholder="San Francisco, CA" />
                    <InputField label="LinkedIn URL" value={data.contact.linkedin} onChange={(v) => update('contact', { ...data.contact, linkedin: v })} placeholder="linkedin.com/in/janesmith" />
                    <InputField label="Website / Portfolio" value={data.contact.website} onChange={(v) => update('contact', { ...data.contact, website: v })} placeholder="janesmith.dev" />
                  </div>
                </AccordionSection>

                {/* Summary */}
                <AccordionSection title="Professional Summary" isOpen={openAccordion === 'summary'} onToggle={() => setOpenAccordion(openAccordion === 'summary' ? '' : 'summary')} badge={data.summary ? '✓' : undefined}>
                  <SectionEditor
                    content={data.summary}
                    onChange={(html) => update('summary', html)}
                    placeholder="Write a compelling 2–3 sentence summary highlighting your expertise, key achievements, and career goal…"
                    minHeight="120px"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">Keep it to 3–5 sentences. Avoid personal pronouns (I, my).</p>
                </AccordionSection>

                {/* Experience */}
                <AccordionSection title="Work Experience" isOpen={openAccordion === 'experience'} onToggle={() => setOpenAccordion(openAccordion === 'experience' ? '' : 'experience')} badge={data.experience.length > 0 ? `${data.experience.length}` : undefined}>
                  <div className="space-y-5">
                    {data.experience.map((exp, idx) => (
                      <div key={exp.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Position {idx + 1}</span>
                          <button type="button" onClick={() => removeExp(exp.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Job title" value={exp.role} onChange={(v) => updateExp(exp.id, 'role', v)} placeholder="Senior Engineer" />
                          <InputField label="Company" value={exp.company} onChange={(v) => updateExp(exp.id, 'company', v)} placeholder="Acme Corp" />
                          <InputField label="Start date" value={exp.startDate} onChange={(v) => updateExp(exp.id, 'startDate', v)} placeholder="Jan 2022" />
                          <div>
                            <InputField label="End date" value={exp.endDate} onChange={(v) => updateExp(exp.id, 'endDate', v)} placeholder="Present" />
                            <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                              <input type="checkbox" checked={exp.current} onChange={(e) => updateExp(exp.id, 'current', e.target.checked)} className="accent-indigo-500" />
                              Currently working here
                            </label>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-slate-400">Responsibilities & achievements</p>
                          <SectionEditor
                            content={exp.bullets}
                            onChange={(html) => updateExp(exp.id, 'bullets', html)}
                            placeholder="• Led a team of 5 engineers to deliver X feature, resulting in 30% performance improvement…"
                            minHeight="90px"
                          />
                          <p className="mt-1.5 text-[11px] text-slate-500">Start each bullet with an action verb: Led, Built, Increased, Reduced…</p>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addExperience}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors">
                      <PlusCircle className="h-4 w-4" /> Add Position
                    </button>
                  </div>
                </AccordionSection>

                {/* Skills */}
                <AccordionSection title="Skills" isOpen={openAccordion === 'skills'} onToggle={() => setOpenAccordion(openAccordion === 'skills' ? '' : 'skills')} badge={data.skills.length > 0 ? `${data.skills.length}` : undefined}>
                  <div className="space-y-3">
                    {data.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {data.skills.map((sk) => (
                          <span key={sk} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                            {sk}
                            <button type="button" onClick={() => removeSkill(sk)} className="text-slate-500 hover:text-rose-400 transition-colors"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); } }}
                        placeholder="Type a skill and press Enter…"
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 transition-colors" />
                      <button type="button" onClick={() => addSkill(skillInput)} className="rounded-xl bg-indigo-500/20 px-3 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(SKILL_SUGGESTIONS[data.persona] ?? []).filter((s) => !data.skills.includes(s)).map((s) => (
                        <button key={s} type="button" onClick={() => addSkill(s)}
                          className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 hover:border-indigo-500/30 hover:text-indigo-300 transition-colors">
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </AccordionSection>

                {/* Education */}
                <AccordionSection title="Education" isOpen={openAccordion === 'education'} onToggle={() => setOpenAccordion(openAccordion === 'education' ? '' : 'education')} badge={data.education.length > 0 ? `${data.education.length}` : undefined}>
                  <div className="space-y-4">
                    {data.education.map((edu, idx) => (
                      <div key={edu.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Entry {idx + 1}</span>
                          <button type="button" onClick={() => removeEdu(edu.id)} className="text-slate-600 hover:text-rose-400 transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Degree / Qualification" value={edu.degree} onChange={(v) => updateEdu(edu.id, 'degree', v)} placeholder="B.Sc. Computer Science" />
                          <InputField label="Institution" value={edu.institution} onChange={(v) => updateEdu(edu.id, 'institution', v)} placeholder="MIT" />
                          <InputField label="Year" value={edu.year} onChange={(v) => updateEdu(edu.id, 'year', v)} placeholder="2020" />
                          <InputField label="GPA (optional)" value={edu.gpa} onChange={(v) => updateEdu(edu.id, 'gpa', v)} placeholder="3.8" />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addEducation}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors">
                      <PlusCircle className="h-4 w-4" /> Add Education
                    </button>
                  </div>
                </AccordionSection>
              </div>

              {/* Right — compact ATS + live preview */}
              <div className="hidden lg:block">
                <div className="sticky top-4 space-y-4">
                  {/* Mini ATS bar */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <MiniAtsBar score={atsScore} />
                  </div>

                  <p className="text-xs font-medium text-slate-400">Live Preview</p>
                  <div className="overflow-hidden rounded-xl border border-white/5">
                    <ResumePreview data={data} scale={0.5} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3 — Optimize with AI
          ═══════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              {/* Left */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white">Optimize with AI</h1>
                  <p className="mt-1 text-sm text-slate-400">Review your ATS score, address any gaps, and optionally tailor to a specific role.</p>
                </div>

                {/* ATS score card */}
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:flex-row sm:items-start">
                  <AtsScoreRing score={atsScore} />
                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div>
                      <p className="text-sm font-semibold text-white">ATS Readiness</p>
                      <p className="mt-0.5 text-xs text-slate-500">Based on the content you've entered so far.</p>
                    </div>

                    {/* Dynamic tips — only show what's missing */}
                    {pendingTips.length > 0 ? (
                      <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 px-4 py-3 space-y-2">
                        <p className="text-[11px] font-semibold text-indigo-300">To improve your score:</p>
                        <ul className="space-y-1.5">
                          {pendingTips.map((t) => (
                            <li key={t.id} className="flex items-start gap-2 text-xs text-slate-300">
                              <span className="mt-0.5 shrink-0 text-indigo-400">›</span>
                              {t.tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                        <p className="text-xs font-semibold text-emerald-300">All sections complete!</p>
                        <p className="mt-0.5 text-[11px] text-emerald-400/70">Your resume is well-structured. Tailor it to a specific job for an even higher score.</p>
                      </div>
                    )}

                    <button type="button" onClick={() => void runAiScan()} disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-60 transition-colors">
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiLoading ? 'Scanning…' : 'Run ATS Scan'}
                    </button>
                  </div>
                </div>

                {/* Job description */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Job Description</label>
                  <textarea value={data.jobDesc} onChange={(e) => update('jobDesc', e.target.value)}
                    placeholder="Paste a job description to unlock AI keyword matching and tailored rewrites…"
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 transition-colors" />
                  {data.jobDesc.trim().length > 20 && (
                    <p className="text-[11px] text-indigo-400/80">✦ AI will match keywords from this description against your résumé.</p>
                  )}
                </div>

                {/* ATS warning */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
                  <span className="text-base shrink-0">⚠</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-300">ATS Compatibility Note</p>
                    <p className="mt-0.5 text-xs text-amber-400/70 leading-relaxed">Avoid tables, images, columns, or text boxes. ATS parsers work best with single-column layouts and plain bullet points.</p>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="hidden lg:block">
                <div className="sticky top-4 space-y-4">
                  <p className="text-xs font-medium text-slate-400">Live Preview</p>
                  <div className="overflow-hidden rounded-xl border border-white/5">
                    <ResumePreview data={data} scale={0.5} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 4 — Review & Save
          ═══════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-bold text-white">Review & Save</h1>
                <p className="mt-1 text-sm text-slate-400">Everything looks good? Create your résumé and open it in the full editor.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                {/* Left */}
                <div className="space-y-6">
                  {/* ATS score summary */}
                  <div className="flex items-center gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                    <AtsScoreRing score={atsScore} />
                    <div className="space-y-1">
                      <p className="text-base font-bold text-white">{data.title}</p>
                      {data.targetRole && <p className="text-sm text-slate-400">{data.targetRole}</p>}
                      <p className="text-xs text-slate-500">{TEMPLATES.find((t) => t.id === data.selectedTemplate)?.name} template</p>
                    </div>
                  </div>

                  {/* Readiness checklist */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <p className="mb-4 text-xs font-semibold text-slate-400">Readiness Checklist</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Professional summary written', done: !!data.summary.replace(/<[^>]+>/g, '').trim() },
                        { label: 'At least one work experience', done: data.experience.length >= 1 },
                        { label: 'Skills section filled', done: data.skills.length >= 3 },
                        { label: 'Education added', done: data.education.length >= 1 },
                        { label: 'Contact info complete', done: !!(data.contact.name && data.contact.email && data.contact.phone) },
                        { label: 'ATS score ≥ 70', done: atsScore >= 70 },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-3 text-sm">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>
                            {done ? '✓' : '–'}
                          </span>
                          <span className={done ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Low score warning */}
                  {atsScore < 60 && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                      <span className="shrink-0 text-amber-400">⚠</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-300">Your ATS score is below 60</p>
                        <p className="mt-0.5 text-[11px] text-amber-400/70 leading-relaxed">
                          Consider going back to Step 3 to address the flagged items before saving.{' '}
                          <button type="button" onClick={() => setStep(3)} className="underline hover:text-amber-300 transition-colors">Back to Optimize</button>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Primary CTA */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center space-y-3">
                    <button type="button" onClick={() => void handleCreate()} disabled={creating || exported}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-8 py-3 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-50 transition-colors">
                      {creating ? 'Creating…' : exported ? 'Created!' : 'Create & Save'}
                      {!creating && !exported && <ArrowUpRight className="h-4 w-4" />}
                    </button>
                    <p className="text-xs text-slate-500">Opens in the full editor — you can export PDF or DOCX from there.</p>
                    {createError && <p className="text-xs text-rose-400">{createError}</p>}
                  </div>

                  {exported && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">Résumé created</p>
                        <p className="text-xs text-emerald-400/70">Opening editor…</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right — Final preview */}
                <div>
                  <p className="mb-3 text-xs font-medium text-slate-400">Final Preview</p>
                  <div className="overflow-hidden rounded-xl border border-white/5 shadow-xl">
                    <ResumePreview data={data} scale={0.52} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation footer ── */}
      <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6">
        <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-40 transition-colors">
          ← Back
        </button>

        <span className="text-xs text-slate-600">{step < 4 ? 'Auto-saved' : ''}</span>

        {step < 4 ? (
          <button type="button"
            onClick={() => { if (step === 3) void runAiScan(); setStep((s) => s + 1); }}
            disabled={step === 1 && !data.title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-400 disabled:opacity-50 transition-colors">
            {step === 3 ? 'Review →' : 'Continue →'}
          </button>
        ) : (
          <button type="button" onClick={() => void handleCreate()} disabled={creating || exported}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-6 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-50 transition-colors">
            {creating ? 'Creating…' : 'Create & Save'}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Accordion helper ─────────────────────────────────────────────────────────

function AccordionSection({
  title, isOpen, onToggle, badge, children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <button type="button" onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          {badge && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">{badge}</span>
          )}
        </div>
        <span className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-white/5 px-5 pb-5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
