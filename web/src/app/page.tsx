'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  AnimatePresence,
} from 'framer-motion';
import {
  Sparkles,
  Globe,
  Star,
  CheckCircle,
  FileText,
  ChevronRight,
  Database,
  MousePointer2,
  TrendingUp,
  Bot,
  Github,
} from 'lucide-react';
import { BillingCycle, PlanTier, type PricingPlan } from '@nextjs-blox/shared-types';
import { billingApi } from '@/lib/api';
import { InteractiveGridPattern } from '../components/shared/interactive-grid-pattern';
import { WaveGridBackground } from '../components/shared/wave-grid-background';
import { HexagonBackground } from '../components/shared/hexagon-background';
import { cn } from '@/lib/utils';

// ── brand token ──────────────────────────────────────────────────────────────
const CYAN = '#1ECEFA';
const OBSIDIAN = '#0C0F13';
const SURFACE = '#161B22';
const HERO_GRID_CELL = 50;
const HERO_GRID_BORDER = 'rgba(63, 63, 70, 0.4)';

// ── spring presets ────────────────────────────────────────────────────────────
const SPRING_GOD_MODE = { type: 'spring', stiffness: 400, damping: 30, mass: 1 } as const;

// ── sub-components ────────────────────────────────────────────────────────────

/** Glowing cyan cube logo mark with logo-sync pulsing */
function BloxLogo({ size = 36, pulse = false }: { size?: number; pulse?: boolean }) {
  const cell = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* top-left: glowing cyan block */}
      <motion.rect
        x="1"
        y="1"
        width={cell}
        height={cell}
        rx="4"
        fill={CYAN}
        animate={pulse ? {
          filter: ['drop-shadow(0 0 2px #1ECEFA)', 'drop-shadow(0 0 12px #1ECEFA)', 'drop-shadow(0 0 2px #1ECEFA)'],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* top-right: muted */}
      <rect x="19" y="1" width={cell} height={cell} rx="4" fill={SURFACE} />
      {/* bottom-left: muted */}
      <rect x="1" y="19" width={cell} height={cell} rx="4" fill={SURFACE} />
      {/* bottom-right: muted */}
      <rect x="19" y="19" width={cell} height={cell} rx="4" fill={SURFACE} />
    </svg>
  );
}

/** Glassmorphic animated feature card */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
  className,
  children,
  spark = false,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
  spark?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [glowPoint, setGlowPoint] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlowPoint({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  function onMouseLeave() {
    setIsHovering(false);
  }

  return (
    <motion.div
      className={cn("group relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.06] p-7 backdrop-blur-2xl flex flex-col", className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, ...SPRING_GOD_MODE }}
      whileHover={{ y: -8, scale: 1.015 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
      style={{
        boxShadow: isHovering
          ? `0 18px 45px -20px rgba(30,206,250,0.7), inset 0 1px 0 rgba(255,255,255,0.28)`
          : "0 12px 30px -22px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-16"
        animate={{ x: ["-85%", "160%"] }}
        transition={{ duration: 5.5 + delay, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(190,235,255,0.06) 40%, rgba(190,235,255,0.26) 50%, rgba(255,255,255,0) 62%)",
          opacity: 0.45,
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: isHovering ? 1 : spark ? 0.9 : 0.55 }}
        transition={{ duration: 0.25 }}
        style={{
          background: `radial-gradient(circle at ${glowPoint.x}% ${glowPoint.y}%, rgba(30,206,250,0.24) 0%, rgba(30,206,250,0.1) 22%, rgba(0,0,0,0) 62%)`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-b from-white/15 via-white/0 to-transparent" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-auto">
          <motion.div
            className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[#1ECEFA]"
            animate={spark ? { rotate: [0, 7, -7, 0], scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            <Icon size={22} />
          </motion.div>
          <h3 className="mb-3 text-lg font-black uppercase tracking-tight text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-300/90">{desc}</p>
        </div>
        {children && <div className="mt-8 flex-1">{children}</div>}
      </div>

      {spark && (
        <motion.div
          className="absolute right-5 top-5 h-2 w-2 rounded-full bg-[#1ECEFA]"
          animate={{ scale: [1, 3.2, 1], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}

      <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#1ECEFA]/12 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

/** Animated number counter */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); return; }
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/** Single AI demo block that snaps into grid */
function DemoBlock({ label, delay, col, row }: { label: string; delay: number; col: number; row: number }) {
  return (
    <motion.div
      className="flex items-center justify-center rounded-lg border text-xs font-semibold text-white/80"
      style={{
        gridColumn: col,
        gridRow: row,
        borderColor: `${CYAN}30`,
        background: `linear-gradient(135deg, ${CYAN}12, rgba(8,11,20,0.9))`,
      }}
      initial={{ opacity: 0, scale: 0.3, y: -40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, ...SPRING_GOD_MODE }}
      whileHover={{ scale: 1.04, boxShadow: `0 0 16px ${CYAN}50` }}
    >
      {label}
    </motion.div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const sec1 = useRef<HTMLElement>(null);
  const sec2 = useRef<HTMLElement>(null);
  const sec4 = useRef<HTMLElement>(null);

  // section refs for Glow-Flow
  // AI Spark animation
  const [sparkIndex, setSparkIndex] = useState<number | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * 9);
      setSparkIndex(idx);
      setTimeout(() => setSparkIndex(null), 1500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // AI demo animation
  const [demoPhase, setDemoPhase] = useState<'idle' | 'typing' | 'snapping' | 'done'>('idle');
  const [typedText, setTypedText] = useState('');
  const [isAnnual, setIsAnnual] = useState(true);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const DEMO_TEXT = '5yr dev. React, Node, AWS. Ex-Stripe. Open source contributor. CS Stanford.';

  useEffect(() => {
    let mounted = true;

    const loadPricingPlans = async () => {
      try {
        const result = await billingApi.getPlans() as { plans?: PricingPlan[] };
        if (mounted && Array.isArray(result?.plans)) {
          setPricingPlans(result.plans);
        }
      } catch (error) {
        console.error('Failed to load pricing plans', error);
      } finally {
        if (mounted) {
          setPricingLoading(false);
        }
      }
    };

    void loadPricingPlans();

    return () => {
      mounted = false;
    };
  }, []);

  const DEMO_BLOCKS = [
    { label: 'Experience', col: 1, row: 1 },
    { label: 'Skills', col: 2, row: 1 },
    { label: 'Projects', col: 1, row: 2 },
    { label: 'Education', col: 2, row: 2 },
    { label: 'Open Source', col: 1, row: 3 },
    { label: 'Achievements', col: 2, row: 3 },
  ];

  const FEATURES = [
    {
      icon: Database,
      title: 'AI-Powered Imports',
      desc: 'Pull unified data from LinkedIn, GitHub, Upwork and 22+ networks automatically.',
      className: "md:col-span-2 md:row-span-2",
      visual: (
        <div className="relative h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0C0F13]/50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="flex h-full items-center justify-center gap-2 sm:gap-4 px-2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0077b5]/20 font-bold text-[#0077b5] border border-[#0077b5]/50 shadow-[0_0_20px_rgba(0,119,181,0.5)]">in</div>
            <div className="hidden sm:block h-0.5 w-6 bg-gradient-to-r from-[#0077b5] to-[#1ECEFA]" />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1ECEFA]/20 text-[#1ECEFA] border border-[#1ECEFA]/50 shadow-[0_0_30px_rgba(30,206,250,0.6)] z-10"><Bot size={40} /></div>
            <div className="hidden sm:block h-0.5 w-6 bg-gradient-to-r from-[#1ECEFA] to-white/80" />
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.3)]"><Github size={24} /></div>
          </div>
        </div>
      )
    },
    {
      icon: Sparkles,
      title: 'Smart About & Bio Refinement',
      desc: 'Our AI normalizes and enriches your professional summary for maximum impact.',
      className: "md:col-span-1 md:row-span-1",
    },
    {
      icon: FileText,
      title: 'ATS-Compliant Materials',
      desc: 'Generate high-score resumes and cover letters tailored for applicant tracking systems.',
      className: "md:col-span-1 md:row-span-1",
    },
    {
      icon: MousePointer2,
      title: 'Drag-and-Drop Editor',
      desc: 'Rearrange resume sections as independent blocks with physical weight.',
      className: "md:col-span-1 md:row-span-2",
      visual: (
        <div className="mt-4 flex flex-col gap-3">
          <div className="h-12 w-full rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform -rotate-2 -translate-x-2">
            <div className="h-4 w-4 rounded-sm bg-[#1ECEFA]/50" />
            <div className="h-2 w-1/2 rounded-full bg-white/20" />
          </div>
          <div className="h-12 w-full rounded-xl border border-[#1ECEFA]/40 bg-[#1ECEFA]/15 p-3 flex items-center gap-3 shadow-[0_16px_32px_rgba(30,206,250,0.25)] transform rotate-1 translate-x-2 z-10 scale-[1.05]">
            <div className="h-4 w-4 rounded-sm bg-[#1ECEFA]" />
            <div className="h-2 w-2/3 rounded-full bg-white/90" />
          </div>
          <div className="h-12 w-full rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform rotate-1 translate-x-1">
            <div className="h-4 w-4 rounded-sm bg-[#1ECEFA]/30" />
            <div className="h-2 w-1/3 rounded-full bg-white/10" />
          </div>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: 'Built-in Analytics',
      desc: 'Track views, engagement, and heatmaps to see how recruiters interact.',
      className: "md:col-span-2 md:row-span-1",
      visual: (
        <div className="relative mt-4 h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0C0F13]/50 p-4">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-[2px] px-4">
            {[20, 35, 30, 60, 80, 50, 95, 70, 45, 85, 40].map((h, i) => (
              <motion.div
                key={i}
                className="w-full rounded-t-sm bg-gradient-to-t from-[#1ECEFA]/10 to-[#1ECEFA]/60"
                initial={{ height: "0%" }}
                whileInView={{ height: `${h}%` }}
                transition={{ duration: 1, delay: i * 0.05 + 0.5, ease: "easeOut" }}
                viewport={{ once: true }}
              />
            ))}
          </div>
          <div className="absolute top-3 left-4 rounded bg-[#1ECEFA]/20 px-2 py-0.5 text-[10px] font-bold text-[#1ECEFA]">LIVE DATA</div>
        </div>
      )
    },
    {
      icon: Globe,
      title: 'Real Hosting & Domains',
      desc: 'Go live on yourname.blox.app or connect your own custom domain.',
      className: "md:col-span-1 md:row-span-1",
    },
  ];

  const runDemo = useCallback(() => {
    if (demoPhase !== 'idle' && demoPhase !== 'done') return;
    setDemoPhase('typing');
    setTypedText('');
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTypedText(DEMO_TEXT.slice(0, i));
      if (i >= DEMO_TEXT.length) {
        clearInterval(iv);
        setTimeout(() => setDemoPhase('snapping'), 400);
        setTimeout(() => setDemoPhase('done'), 1800);
      }
    }, 28);
  }, [demoPhase, DEMO_TEXT]);

  const handleSpotlightMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  }, []);

  const getPlanAmount = useCallback((tier: PlanTier, cycle: BillingCycle) => {
    return pricingPlans.find((plan) => plan.tier === tier && plan.cycle === cycle)?.amountUsd ?? null;
  }, [pricingPlans]);

  const formatUsd = useCallback((value: number | null) => {
    if (value === null) return pricingLoading ? '...' : 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [pricingLoading]);


  return (
    <div
      className="overflow-hidden"
      style={{ background: OBSIDIAN }}
    >

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-6 py-24">
        <InteractiveGridPattern
          className="absolute inset-0"
          cellSize={HERO_GRID_CELL}
          borderColor={HERO_GRID_BORDER}
          responsiveScale={false}
        />

        {/* Hero copy */}
        <div className="relative z-10 max-w-4xl text-center translate-y-12">
          <motion.h1
            className="font-display font-hero-title text-6xl font-black leading-[0.9] tracking-tighter text-white md:text-8xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...SPRING_GOD_MODE }}
          >
            Your Career,
            <br />
            <span className="text-[#1ECEFA]">Block by Blox.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-400 md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, ...SPRING_GOD_MODE }}
          >
            The AI-driven portfolio builder for the modern professional.
            Build, snap, and deploy your professional identity with physical weight and digital precision.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...SPRING_GOD_MODE }}
          >
            <div className="w-full max-w-[260px]">
              <Link
                href="/signup"
                onMouseMove={handleSpotlightMove}
                className="hero-spotlight-btn hero-spotlight-btn-primary group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border bg-[rgba(20,20,20,0.6)] px-8 py-[0.9rem] text-[0.9rem] uppercase tracking-[0.12em] text-[#c6e3ff] backdrop-blur-[6px] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                style={{ fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                <span className="hero-spotlight-btn-shine" />
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(135,200,255,0.5) 0%, rgba(80,145,255,0.28) 22%, rgba(0,0,0,0) 55%)',
                  }}
                />
                <span className="relative pointer-events-none">Get Started</span>
              </Link>
            </div>

           
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS
  
      {/* ══════════════════════════════════════════════════════════════════════
          AI AUTO-SNAP DEMO
      ══════════════════════════════════════════════════════════════════════ */}
    

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES (Bento Grid)
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={sec2 as React.RefObject<HTMLElement>} className="relative overflow-hidden px-6 py-32">
        <WaveGridBackground className="absolute inset-0" gridSize={32} waveHeight={34} waveSpeed={1.05} color={CYAN} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.62)_0%,rgba(3,7,18,0.38)_40%,rgba(3,7,18,0.75)_100%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_GOD_MODE}
          >
            <motion.p
              className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#7edcff]"
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              Everything You Need
            </motion.p>
            <h2 className="font-display text-4xl font-black tracking-tighter text-white md:text-7xl">
              GLASS SYSTEMS. <span className="text-[#1ECEFA]">LIVE MOTION.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-300/85 md:text-base">
              A fully animated toolkit where every capability is layered in glass, depth, and reactive light.
            </p>
          </motion.div>

          <div className="grid gap-6 auto-rows-min grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                delay={i * 0.06}
                spark={sparkIndex === i}
                className={f.className}
              >
                {f.visual}
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS (Process Flow)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 py-32" style={{ background: '#0C0F13' }}>
        <div className="absolute inset-0">
          <HexagonBackground 
            hexagonSize={45} 
            hexagonMargin={3} 
            glowColor="rgba(30, 206, 250, 0.4)" 
            className="opacity-60"
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_GOD_MODE}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#7edcff]">Workflow</p>
            <h2 className="font-display text-4xl font-black tracking-tighter text-white md:text-5xl">
              From Chaos to <span className="text-[#1ECEFA]">Deployed.</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting Line (Desktop only) */}
            <div className="absolute left-1/2 top-10 hidden h-[calc(100%-80px)] w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-[#1ECEFA]/20 to-transparent md:block" />

            <div className="space-y-12 md:space-y-0 text-center md:text-left">
              {[
                {
                  step: "01",
                  title: "Connect & Ingest",
                  desc: "Drop in your LinkedIn URL or raw text. Our engine instantly processes and cleans the data.",
                  icon: Database,
                },
                {
                  step: "02",
                  title: "AI Refinement",
                  desc: "Blox normalizes formatting, identifies skill gaps, and enhances your bullet points for maximum impact.",
                  icon: Sparkles,
                },
                {
                  step: "03",
                  title: "Visual Snap",
                  desc: "Drag the processed nodes into any template block. Everything snaps together with pixel-perfect alignment.",
                  icon: MousePointer2,
                },
                {
                  step: "04",
                  title: "Instant Publish",
                  desc: "Hit deploy to launch your personal site globally, complete with custom domains and analytics.",
                  icon: Globe,
                }
              ].map((step, i) => (
                <div key={step.step} className="relative flex flex-col items-center md:flex-row md:even:flex-row-reverse group">
                  
                  {/* The central node representing the step number */}
                  <motion.div
                    className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0C0F13] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-[#1ECEFA]/40 group-hover:scale-110 md:absolute md:left-1/2 md:-translate-x-1/2"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: i * 0.1, ...SPRING_GOD_MODE }}
                  >
                    <div className="absolute inset-2 rounded-xl bg-gradient-to-b from-[#1ECEFA]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="font-display text-2xl font-black text-[#1ECEFA]">{step.step}</span>
                  </motion.div>

                  {/* Content Box */}
                  <motion.div
                    className={`mt-6 w-full max-w-md md:mt-0 md:w-1/2 ${i % 2 === 0 ? 'md:pr-20 md:text-right' : 'md:pl-20 md:text-left'}`}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: i * 0.1 + 0.1, ...SPRING_GOD_MODE }}
                  >
                    <div className={`relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 group-hover:border-[#1ECEFA]/20 group-hover:bg-white/[0.05]`}>
                      <div className={`mb-4 flex items-center gap-4 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''} justify-center md:justify-start`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1ECEFA]/10 text-[#1ECEFA]">
                          <step.icon size={20} />
                        </div>
                        <h3 className="font-display text-2xl font-black text-white">{step.title}</h3>
                      </div>
                      <p className="text-base text-slate-400">{step.desc}</p>
                    </div>
                  </motion.div>

                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-24" style={{ background: '#0b0f1a' }}>
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_GOD_MODE}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: CYAN }}>Loved by builders</p>
            <h2 className="font-display text-3xl font-black text-white md:text-4xl">Real results. Real careers.</h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { quote: 'I landed three interviews the week I switched to Blox. The ATS scorer alone is worth it.', name: 'Amara O.', role: 'Senior SWE → FAANG' },
              { quote: 'As a freelancer my portfolio was all over the place. Blox imported everything and made it look incredible.', name: 'Tunde B.', role: 'Full-Stack Freelancer' },
              { quote: 'I spent weeks on my resume before. Now I generate a tailored version for each job in under 5 minutes.', name: 'Chioma E.', role: 'Product Designer' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                className="relative overflow-hidden rounded-2xl border p-6"
                style={{ borderColor: '#1e2535', background: 'linear-gradient(135deg, #111827, #0d1420)' }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ...SPRING_GOD_MODE }}
                whileHover={{ y: -4, borderColor: `${CYAN}40` }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={12} fill={CYAN} style={{ color: CYAN }} />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-300">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={sec4 as React.RefObject<HTMLElement>} className="px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_GOD_MODE}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: CYAN }}>Pricing</p>
            <h2 className="font-display text-4xl font-black text-white md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-semibold transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: isAnnual ? CYAN : '#1e2535' }}
              >
                <span className="sr-only">Toggle annual pricing</span>
                <span
                  className={`${isAnnual ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition duration-300`}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors duration-300 ${isAnnual ? 'text-white' : 'text-slate-500'}`}>Annually</span>
              <span className="ml-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black" style={{ background: CYAN }}>Save up to 35%</span>
            </div>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Free',
                priceMonthly: '$0',
                priceAnnual: '$0',
                periodMonthly: '',
                periodAnnual: '',
                features: ['Basic templates', '1 portfolio', 'Watermarked'],
                highlight: false,
                popular: false,
              },
              {
                name: 'Pro',
                priceMonthly: formatUsd(getPlanAmount(PlanTier.PRO, BillingCycle.MONTHLY)),
                priceAnnual: formatUsd(getPlanAmount(PlanTier.PRO, BillingCycle.ANNUAL)),
                periodMonthly: '/mo',
                periodAnnual: '/yr',
                features: ['Unlimited portfolios', 'Custom domain', 'Analytics reporting', 'Advanced AI features'],
                highlight: true,
                popular: true,
              },
              {
                name: 'Premium',
                priceMonthly: formatUsd(getPlanAmount(PlanTier.PREMIUM, BillingCycle.MONTHLY)),
                priceAnnual: formatUsd(getPlanAmount(PlanTier.PREMIUM, BillingCycle.ANNUAL)),
                periodMonthly: '/mo',
                periodAnnual: '/yr',
                features: ['Everything in Pro', 'E-commerce integration', 'Video résumé blocks', 'Career coach AI'],
                highlight: false,
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                className="relative overflow-hidden rounded-[2rem] border p-8 text-left"
                style={{
                  borderColor: plan.highlight ? CYAN : '#1e2535',
                  background: plan.highlight
                    ? `linear-gradient(135deg, ${CYAN}15, rgba(8,11,20,0.95))`
                    : 'linear-gradient(135deg, rgba(17,24,39,0.6), rgba(13,20,32,0.8))',
                  boxShadow: plan.highlight ? `0 0 40px ${CYAN}20` : 'none',
                  backdropFilter: 'blur(16px)',
                }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ...SPRING_GOD_MODE }}
                whileHover={{ scale: 1.02, y: -6 }}
              >
                {plan.popular && isAnnual && (
                  <div
                    className="absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-[0_0_12px_rgba(30,206,250,0.5)]"
                    style={{ background: CYAN }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-display text-4xl font-black text-white">{isAnnual ? plan.priceAnnual : plan.priceMonthly}</span>
                  <span className="mb-1 text-sm text-slate-400">{isAnnual ? plan.periodAnnual : plan.periodMonthly}</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="flex shrink-0 items-center justify-center rounded-full p-0.5" style={{ background: plan.highlight ? `${CYAN}20` : 'rgba(255,255,255,0.05)' }}>
                        <CheckCircle size={14} style={{ color: plan.highlight ? CYAN : '#6b7280' }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Link href={plan.name === 'Free' ? '/signup' : '/pricing'} className="w-full">
                    <motion.div
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold tracking-wide"
                      style={
                        plan.highlight
                          ? { background: CYAN, color: '#000' }
                          : { border: `1px solid ${CYAN}30`, color: 'white', background: 'rgba(255,255,255,0.03)' }
                      }
                      whileHover={{
                        scale: 1.02,
                        boxShadow: plan.highlight ? `0 0 24px ${CYAN}70` : `0 0 12px ${CYAN}30`,
                        background: plan.highlight ? CYAN : `${CYAN}15`,
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_GOD_MODE}
                    >
                      {plan.name === 'Free' ? 'Start for free' : 'Get started'} <ChevronRight size={16} />
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════════════════
          LIQUID CTA (Footer)
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={sec4 as React.RefObject<HTMLElement>} className="relative overflow-hidden px-6 py-40 text-center">
        <motion.div
          className="relative z-10 mx-auto max-w-4xl"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={SPRING_GOD_MODE}
        >
          <h2 className="mb-12 font-display text-5xl font-black tracking-tighter text-white md:text-8xl">
            READY TO <span className="text-[#1ECEFA]">BUILD?</span>
          </h2>
          
          <LiquidButton />
        </motion.div>
      </section>
    </div>
  );
}

/** Liquid CTA Button with Particle Explosion */
function LiquidButton() {
  const [isExploding, setIsExploding] = useState(false);
  
  return (
    <div className="relative inline-block">
      <motion.button
        className="relative z-10 block overflow-hidden bg-[#1ECEFA] px-12 py-6 text-lg font-black text-black"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={SPRING_GOD_MODE}
        onClick={() => {
          setIsExploding(true);
          setTimeout(() => setIsExploding(false), 2000);
        }}
      >
        <span className={isExploding ? "opacity-0" : "opacity-100"}>START BUILDING</span>
        {isExploding && (
          <span className="absolute inset-0 flex items-center justify-center text-sm tracking-[0.2em]">LOADING...</span>
        )}
      </motion.button>

      {/* Gooey/Liquid Filter SVG */}
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Particles */}
      {isExploding && Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 bg-[#1ECEFA]"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
