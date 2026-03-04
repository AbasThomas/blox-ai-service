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
  BriefcaseBusiness,
  Globe,
  BarChart3,
  X,
  PlusCircle,
  Settings,
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
  { id: 'job-seeker', label: 'Job Seeker', emoji: '🎯', desc: 'Traditional employment' },
  { id: 'freelancer', label: 'Freelancer', emoji: '💼', desc: 'Independent contractor' },
  { id: 'executive', label: 'Executive', emoji: '🏢', desc: 'Senior leadership' },
  { id: 'academic', label: 'Academic', emoji: '🎓', desc: 'Research / teaching' },
];

const STEP_LABELS = ['Template', 'Fill Data', 'AI Tailor', 'Review'];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  'job-seeker': ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability'],
  freelancer: ['Client Management', 'Project Management', 'Self-motivated', 'Negotiation'],
  executive: ['Strategic Leadership', 'P&L Management', 'Stakeholder Engagement', 'Vision'],
  academic: ['Research Methods', 'Academic Writing', 'Grant Writing', 'Peer Review'],
};

const AI_SUGGESTIONS = [
  'Shorten your summary to 3 sentences for better readability.',
  'Add quantified achievements — "Increased revenue by 23%".',
  'Start each bullet with a strong action verb.',
  'Include more role-specific keywords from the job description.',
  'Add a "Core Competencies" section for quick ATS scanning.',
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
      <div className="border-b-2 border-[#1a1a1a] px-6 py-5" style={{ padding: `${20 * scale}px ${24 * scale}px` }}>
        <h1 className="font-sans font-bold text-[#1a1a1a]" style={{ fontSize: `${20 * scale}px`, lineHeight: 1.2 }}>
          {data.contact.name || data.title || 'Your Name'}
        </h1>
        {data.targetRole && (
          <p className="mt-0.5 font-sans font-medium text-[#555]" style={{ fontSize: `${11 * scale}px`, marginTop: `${4 * scale}px` }}>
            {data.targetRole}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-3 font-sans text-[#666]" style={{ fontSize: `${9 * scale}px`, marginTop: `${6 * scale}px` }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
          {data.contact.location && <span>{data.contact.location}</span>}
          {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
        </div>
      </div>

      <div style={{ padding: `${14 * scale}px ${24 * scale}px`, gap: `${14 * scale}px`, display: 'flex', flexDirection: 'column' }}>
        {/* Summary */}
        {data.summary && (
          <section>
            <h2 className="font-sans font-bold uppercase tracking-wider" style={{ fontSize: `${9 * scale}px`, borderBottom: `1px solid #ccc`, paddingBottom: `${3 * scale}px`, marginBottom: `${6 * scale}px` }}>
              Professional Summary
            </h2>
            <div
              className="text-[#333] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.summary.replace(/<[^>]+>/g, (tag) => tag) }}
              style={{ fontSize: `${10 * scale}px` }}
            />
          </section>
        )}

        {/* Experience */}
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
                {exp.bullets && (
                  <div
                    className="mt-1 text-[#333]"
                    dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    style={{ fontSize: `${9.5 * scale}px` }}
                  />
                )}
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {skillsText && (
          <section>
            <h2 className="font-sans font-bold uppercase tracking-wider" style={{ fontSize: `${9 * scale}px`, borderBottom: `1px solid #ccc`, paddingBottom: `${3 * scale}px`, marginBottom: `${6 * scale}px` }}>
              Skills
            </h2>
            <p className="text-[#333]" style={{ fontSize: `${10 * scale}px`, lineHeight: 1.6 }}>{skillsText}</p>
          </section>
        )}

        {/* Education */}
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
        {score >= 80 ? 'Excellent' : score >= 60 ? 'Good — Keep editing' : 'Needs improvement'}
      </span>
    </div>
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
  const userId = useBloxStore((s) => s.user.id);
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
  const [aiSuggIdx, setAiSuggIdx] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string>('summary');
  const [exported, setExported] = useState(false);
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

  const atsScore = calcAtsScore(data);

  // ── Experience helpers ──
  const addExperience = () => {
    const newExp: ExperienceItem = { id: Date.now().toString(), role: '', company: '', startDate: '', endDate: '', current: false, bullets: '' };
    update('experience', [...data.experience, newExp]);
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

  // ── Simulate AI scan ──
  const runAiScan = async () => {
    setAiLoading(true);
    try {
      await scannerApi.atsScore({ content: data.summary, jobDesc: data.jobDesc });
    } catch { /* fall through — score is computed locally */ }
    await new Promise((r) => setTimeout(r, 1200));
    setAiLoading(false);
  };

  // ── Final create & navigate ──
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
      setTimeout(() => router.push(`/resumes/${created.id}/edit`), 1800);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create résumé.');
    } finally {
      setCreating(false);
    }
  };

  // ── Input helper ──
  const InputField = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-purple-500/40 focus:bg-white/5 transition-colors"
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
          <button
            type="button"
            onClick={() => router.push('/resumes')}
            className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← All Résumés
          </button>
          <div className="flex items-center gap-2">
            {saving && <span className="text-[10px] text-slate-500">Saving draft…</span>}
            <button
              type="button"
              onClick={() => { localStorage.removeItem(DRAFT_KEY); router.push('/resumes'); }}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
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
                  active
                    ? 'bg-purple-500 text-white'
                    : done
                    ? 'cursor-pointer bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
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
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >

          {/* ═══════════════════════════════════════════════════
              STEP 1 — Template Selection
          ═══════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Left */}
              <div className="space-y-8">
                {/* Title */}
                <div>
                  <h1 className="text-xl font-bold text-white">Create your résumé</h1>
                  <p className="mt-1 text-sm text-slate-400">Choose a template and set your preferences to get started.</p>
                </div>

                {/* Resume title */}
                <InputField label="Résumé title" value={data.title} onChange={(v) => update('title', v)} placeholder="e.g. Senior Engineer Resume" />

                {/* Target role */}
                <InputField label="Target role" value={data.targetRole} onChange={(v) => update('targetRole', v)} placeholder="e.g. Senior Frontend Engineer" />

                {/* Persona */}
                <div>
                  <p className="mb-3 text-xs font-medium text-slate-400">Your profile type</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => update('persona', p.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                          data.persona === p.id
                            ? 'border-purple-500/40 bg-purple-500/10 text-white'
                            : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xl">{p.emoji}</span>
                        <span className="text-xs font-semibold">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template grid */}
                <div>
                  <p className="mb-3 text-xs font-medium text-slate-400">Template</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => update('selectedTemplate', t.id)}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                          data.selectedTemplate === t.id
                            ? 'border-purple-500/50 ring-1 ring-purple-500/30'
                            : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Wireframe preview */}
                        <div className="flex h-24 flex-col gap-1.5 bg-white p-3">
                          {t.preview.map((cls, i) => (
                            <div key={i} className={`rounded-full bg-slate-300 ${cls}`} />
                          ))}
                        </div>
                        {/* Footer */}
                        <div className="bg-[#0C0F13] px-2 py-2">
                          <p className="truncate text-[11px] font-semibold text-slate-200">{t.name}</p>
                          <span className={`mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${t.accent}`}>{t.badge}</span>
                        </div>
                        {data.selectedTemplate === t.id && (
                          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] text-white">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  {/* Pull from portfolio */}
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-200">Pull from Portfolio</p>
                      <p className="mt-0.5 text-xs text-slate-500">Auto-fill bio, projects, skills & contact from your existing portfolio.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => update('pullFromPortfolio', !data.pullFromPortfolio)}
                      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${data.pullFromPortfolio ? 'bg-purple-500' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${data.pullFromPortfolio ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* Tailor to job */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Tailor to Job Description</p>
                        <p className="mt-0.5 text-xs text-slate-500">AI scans the job posting and injects keywords into your résumé.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => update('tailorToJob', !data.tailorToJob)}
                        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${data.tailorToJob ? 'bg-purple-500' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${data.tailorToJob ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {data.tailorToJob && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <textarea
                            value={data.jobDesc}
                            onChange={(e) => update('jobDesc', e.target.value)}
                            placeholder="Paste the full job description here…"
                            rows={5}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500/40 resize-none transition-colors"
                          />
                          <p className="mt-1.5 text-[11px] text-purple-400/70">
                            ✦ AI will match keywords in Step 3
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right — selected template preview */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  <p className="mb-3 text-xs font-medium text-slate-400">Preview</p>
                  <ResumePreview data={data} scale={0.55} />
                  <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                    <p className="text-xs font-semibold text-purple-300">✦ AI Tip</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {data.pullFromPortfolio
                        ? 'We\'ll auto-fill your bio, projects, and skills from your portfolio in the next step.'
                        : 'Toggle "Pull from Portfolio" to save time — no manual entry needed.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2 — Data Import & Auto-Fill
          ═══════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              {/* Left — Accordion sections */}
              <div className="space-y-3">
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white">Fill your résumé</h1>
                  <p className="mt-1 text-sm text-slate-400">Review and edit each section. All fields support rich formatting.</p>
                </div>

                {/* ── Contact ── */}
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

                {/* ── Summary ── */}
                <AccordionSection title="Professional Summary" isOpen={openAccordion === 'summary'} onToggle={() => setOpenAccordion(openAccordion === 'summary' ? '' : 'summary')} badge={data.summary ? '✓' : undefined}>
                  <SectionEditor
                    content={data.summary}
                    onChange={(html) => update('summary', html)}
                    placeholder="Write a compelling 2–3 sentence summary highlighting your expertise, key achievements, and career goal…"
                    minHeight="120px"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">Keep it to 3–5 sentences. Avoid personal pronouns (I, my).</p>
                </AccordionSection>

                {/* ── Experience ── */}
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
                              <input type="checkbox" checked={exp.current} onChange={(e) => updateExp(exp.id, 'current', e.target.checked)} className="accent-purple-500" />
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
                          <p className="mt-1.5 text-[11px] text-purple-400/70">✦ Start each bullet with an action verb: Led, Built, Increased, Reduced…</p>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addExperience} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-purple-500/40 hover:text-purple-300 transition-colors">
                      <PlusCircle className="h-4 w-4" /> Add Position
                    </button>
                  </div>
                </AccordionSection>

                {/* ── Skills ── */}
                <AccordionSection title="Skills" isOpen={openAccordion === 'skills'} onToggle={() => setOpenAccordion(openAccordion === 'skills' ? '' : 'skills')} badge={data.skills.length > 0 ? `${data.skills.length}` : undefined}>
                  <div className="space-y-3">
                    {/* Tag chips */}
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
                    {/* Input */}
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); } }}
                        placeholder="Type a skill and press Enter…"
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-purple-500/40 transition-colors"
                      />
                      <button type="button" onClick={() => addSkill(skillInput)} className="rounded-xl bg-purple-500/20 px-3 text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition-colors">Add</button>
                    </div>
                    {/* Suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {(SKILL_SUGGESTIONS[data.persona] ?? []).filter((s) => !data.skills.includes(s)).map((s) => (
                        <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 hover:border-purple-500/30 hover:text-purple-300 transition-colors">
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </AccordionSection>

                {/* ── Education ── */}
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
                    <button type="button" onClick={addEducation} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-purple-500/40 hover:text-purple-300 transition-colors">
                      <PlusCircle className="h-4 w-4" /> Add Education
                    </button>
                  </div>
                </AccordionSection>
              </div>

              {/* Right — Live preview */}
              <div className="hidden lg:block">
                <div className="sticky top-4 space-y-4">
                  <p className="text-xs font-medium text-slate-400">Live Preview</p>
                  <div className="overflow-hidden rounded-xl border border-white/5">
                    <ResumePreview data={data} scale={0.5} />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <AtsScoreRing score={atsScore} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3 — AI Tailoring
          ═══════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              {/* Left */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white">AI Tailoring & Optimization</h1>
                  <p className="mt-1 text-sm text-slate-400">Let AI optimize your résumé for ATS systems and the specific role.</p>
                </div>

                {/* ATS score card */}
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:flex-row sm:items-start">
                  <AtsScoreRing score={atsScore} />
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <p className="text-sm font-semibold text-white">ATS Readiness Score</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Summary present', done: !!data.summary.replace(/<[^>]+>/g, '').trim() },
                        { label: 'Work experience', done: data.experience.length >= 1 },
                        { label: '5+ skills listed', done: data.skills.length >= 5 },
                        { label: 'Education added', done: data.education.length >= 1 },
                        { label: 'Contact complete', done: !!(data.contact.name && data.contact.email) },
                        { label: 'Job description linked', done: data.jobDesc.trim().length > 20 },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>
                            {done ? '✓' : '–'}
                          </span>
                          <span className={done ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void runAiScan()}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/30 disabled:opacity-60 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiLoading ? 'Scanning…' : 'Run AI Scan'}
                    </button>
                  </div>
                </div>

                {/* Job desc (if tailor toggle off in step 1) */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Job Description (for keyword injection)</label>
                  <textarea
                    value={data.jobDesc}
                    onChange={(e) => update('jobDesc', e.target.value)}
                    placeholder="Paste a job description to unlock AI keyword matching and tailored rewrites…"
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500/40 transition-colors"
                  />
                  {data.jobDesc.trim().length > 20 && (
                    <p className="text-[11px] text-purple-400/70">✦ AI will match keywords from this job description against your résumé.</p>
                  )}
                </div>

                {/* AI Suggestions carousel */}
                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">AI Suggestions</span>
                    <span className="ml-auto text-[10px] text-slate-500">{aiSuggIdx + 1} / {AI_SUGGESTIONS.length}</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{AI_SUGGESTIONS[aiSuggIdx]}</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setAiSuggIdx((i) => Math.max(0, i - 1))} disabled={aiSuggIdx === 0} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors">← Prev</button>
                    <button type="button" onClick={() => setAiSuggIdx((i) => Math.min(AI_SUGGESTIONS.length - 1, i + 1))} disabled={aiSuggIdx === AI_SUGGESTIONS.length - 1} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors">Next →</button>
                  </div>
                </div>

                {/* ATS warning */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-300">ATS Compatibility Note</p>
                    <p className="mt-0.5 text-xs text-amber-400/70 leading-relaxed">Avoid using tables, images, columns, or text boxes in your résumé. These break ATS parsing. Stick to single-column layouts and plain bullet points.</p>
                  </div>
                </div>

                {/* Summary editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">Edit Summary</label>
                    <span className="text-[10px] text-slate-600">{data.summary.replace(/<[^>]+>/g, '').length} chars</span>
                  </div>
                  <SectionEditor content={data.summary} onChange={(html) => update('summary', html)} placeholder="Professional summary…" minHeight="110px" />
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
              STEP 4 — Review & Export
          ═══════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-bold text-white">Review & Finalise</h1>
                <p className="mt-1 text-sm text-slate-400">Everything looks good? Publish or export your résumé.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                {/* Left — checklist + actions */}
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
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {done ? '✓' : '✕'}
                          </span>
                          <span className={done ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export options */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <p className="mb-4 text-xs font-semibold text-slate-400">Save & Export</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { label: 'Save & Edit', desc: 'Open in full editor', icon: FileText, primary: true, action: () => void handleCreate() },
                        { label: 'Export PDF', desc: 'Free with watermark', icon: ArrowUpRight, primary: false, action: () => void handleCreate() },
                        { label: 'Export DOCX', desc: 'Pro only', icon: Settings, primary: false, action: () => void handleCreate() },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={opt.action}
                            disabled={creating}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all disabled:opacity-60 ${
                              opt.primary
                                ? 'border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-white'
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-semibold">{creating && opt.primary ? 'Creating…' : opt.label}</span>
                            <span className="text-[10px] text-slate-500">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {createError && (
                      <p className="mt-3 text-xs text-rose-400">{createError}</p>
                    )}
                  </div>

                  {exported && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">Résumé created!</p>
                        <p className="text-xs text-emerald-400/70">Redirecting to editor…</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right — Preview */}
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
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-40 transition-colors"
        >
          ← Back
        </button>

        <span className="text-xs text-slate-600">{step < 4 ? 'Auto-saved' : ''}</span>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => { if (step === 3) void runAiScan(); setStep((s) => s + 1); }}
            disabled={step === 1 && !data.title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-400 disabled:opacity-50 transition-colors"
          >
            {step === 3 ? 'Review →' : 'Continue →'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating || exported}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-6 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating…' : 'Create Résumé'}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Accordion helper ─────────────────────────────────────────────────────────

function AccordionSection({
  title,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          {badge && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">{badge}</span>
          )}
        </div>
        <span className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-5 pb-5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
