'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  useScroll,
  AnimatePresence,
} from 'framer-motion';
import {
  Sparkles,
  Zap,
  LayoutGrid,
  Globe,
  ArrowRight,
  Star,
  CheckCircle,
  Layers,
  FileText,
  Briefcase,
  Code2,
  GraduationCap,
  Trophy,
  ChevronRight,
} from 'lucide-react';

// ── brand token ──────────────────────────────────────────────────────────────
const CYAN = '#1ECEFA';
const OBSIDIAN = '#0C0F13';
const SURFACE = '#161B22';

// ── spring presets ────────────────────────────────────────────────────────────
const SPRING_GOD_MODE = { type: 'spring', stiffness: 400, damping: 30, mass: 1 } as const;

// ── helpers ───────────────────────────────────────────────────────────────────
function useMousePosition(ref: React.RefObject<HTMLElement>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      x.set(e.clientX - rect.left - rect.width / 2);
      y.set(e.clientY - rect.top - rect.height / 2);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [ref, x, y]);
  return { x, y };
}

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
          filter: [`drop-shadow(0 0 2px ${CYAN})`, `drop-shadow(0 0 12px ${CYAN})`, `drop-shadow(0 0 2px ${CYAN})`],
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

/** Floating 3-D hero block */
function HeroBlock({
  label,
  icon: Icon,
  color,
  delay,
  mouseX,
  mouseY,
  depth,
  initialX,
  initialY,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  delay: number;
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
  depth: number;
  initialX: number;
  initialY: number;
}) {
  const tx = useTransform(mouseX, (v) => v * depth * 0.04);
  const ty = useTransform(mouseY, (v) => v * depth * 0.04);
  const rx = useTransform(mouseY, [-300, 300], [8, -8]);
  const ry = useTransform(mouseX, [-300, 300], [-8, 8]);

  return (
    <motion.div
      className="absolute select-none"
      style={{ left: `${initialX}%`, top: `${initialY}%`, x: tx, y: ty, rotateX: rx, rotateY: ry, perspective: 800 }}
      initial={{ opacity: 0, scale: 0.5, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { delay, duration: 0.6, ease: 'easeOut' },
        scale: { delay, ...SPRING_BOUNCY },
        y: { delay: delay + 0.5, duration: 3.5 + delay, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
      }}
    >
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 backdrop-blur-md"
        style={{
          borderColor: `${color}30`,
          background: `linear-gradient(135deg, ${color}15, rgba(8,11,20,0.85))`,
          boxShadow: `0 0 20px ${color}25, 0 4px 24px rgba(0,0,0,0.4)`,
        }}
      >
        <Icon size={14} style={{ color }} />
        <span className="text-xs font-semibold text-white/80 whitespace-nowrap">{label}</span>
      </div>
    </motion.div>
  );
}

/** Magnetic Bento Card with 3D Parallax and AI-Spark */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
  spark = false,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
  spark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [15, -15]), SPRING_GOD_MODE);
  const rotateY = useSpring(useTransform(x, [-100, 100], [-15, 15]), SPRING_GOD_MODE);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden rounded-none border border-white/5 bg-[#161B22] p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, ...SPRING_GOD_MODE }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={spark ? {
          background: [
            "radial-gradient(circle at 50% 50%, rgba(30,206,250,0) 0%, transparent 100%)",
            "radial-gradient(circle at 50% 50%, rgba(30,206,250,0.1) 0%, transparent 70%)",
            "radial-gradient(circle at 50% 50%, rgba(30,206,250,0) 0%, transparent 100%)",
          ],
        } : {}}
        transition={{ duration: 1.5 }}
      />
      
      <div style={{ transform: "translateZ(20px)" }}>
        <Icon size={24} className="mb-6 text-[#1ECEFA]" />
        <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
      </div>

      {spark && (
        <motion.div
          className="absolute right-4 top-4 h-1 w-1 bg-[#1ECEFA]"
          animate={{ scale: [1, 4, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5 }}
        />
      )}
    </motion.div>
  );
}

/** Animated number counter */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null!);
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
      transition={{ delay, ...SPRING_BOUNCY }}
      whileHover={{ scale: 1.04, boxShadow: `0 0 16px ${CYAN}50` }}
    >
      {label}
    </motion.div>
  );
}

/** Single step row in "How it Works" */
function StepItem({ n, title, desc, delay }: { n: string; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null!);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      className="flex gap-6 md:gap-10"
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, ...SPRING_SOFT }}
    >
      <motion.div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-lg font-black"
        style={{ borderColor: `${CYAN}40`, background: CYAN_DIM, color: CYAN }}
        whileHover={{ scale: 1.1, boxShadow: `0 0 24px ${CYAN}50` }}
        transition={SPRING_BOUNCY}
      >
        {n}
      </motion.div>
      <div className="pt-3">
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{desc}</p>
      </div>
    </motion.div>
  );
}

/** Interactive Grid Background with Proximity Glow */
function InteractiveGrid() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const rows = 40;
  const cols = 60;
  const cellSize = 30;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden opacity-40"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const x = (i % cols) * cellSize + cellSize / 2;
        const y = Math.floor(i / cols) * cellSize + cellSize / 2;
        const dist = Math.hypot(mousePos.x - x, mousePos.y - y);
        const isNear = dist < 150;

        return (
          <motion.div
            key={i}
            className="border-[0.5px] border-white/5"
            animate={{
              backgroundColor: isNear ? CYAN : 'transparent',
              scale: isNear ? 1.2 : 1,
              opacity: isNear ? 1 : 0.3,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 1,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null!);
  const { x: rawX, y: rawY } = useMousePosition(heroRef);
  const mouseX = useSpring(rawX, { stiffness: 60, damping: 20 });
  const mouseY = useSpring(rawY, { stiffness: 60, damping: 20 });

  // section refs for Glow-Flow
  // AI Spark animation
  const [sparkIndex, setSparkIndex] = useState<number | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * 6);
      setSparkIndex(idx);
      setTimeout(() => setSparkIndex(null), 1500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // AI demo animation
  const [demoPhase, setDemoPhase] = useState<'idle' | 'typing' | 'snapping' | 'done'>('idle');
  const [typedText, setTypedText] = useState('');
  const DEMO_TEXT = '5yr dev. React, Node, AWS. Ex-Stripe. Open source contributor. CS Stanford.';

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
  }, [demoPhase]);

  const DEMO_BLOCKS = [
    { label: 'Experience', col: 1, row: 1 },
    { label: 'Skills', col: 2, row: 1 },
    { label: 'Projects', col: 1, row: 2 },
    { label: 'Education', col: 2, row: 2 },
    { label: 'Open Source', col: 1, row: 3 },
    { label: 'Achievements', col: 2, row: 3 },
  ];

  const HERO_BLOCKS = [
    { label: 'Experience', icon: Briefcase, color: CYAN, delay: 0.2, depth: 1.2, initialX: 5, initialY: 15 },
    { label: 'Skills', icon: Code2, color: '#a78bfa', delay: 0.35, depth: 0.8, initialX: 72, initialY: 8 },
    { label: 'Projects', icon: LayoutGrid, color: '#34d399', delay: 0.5, depth: 1.5, initialX: 82, initialY: 55 },
    { label: 'Education', icon: GraduationCap, color: '#f472b6', delay: 0.65, depth: 1.0, initialX: 3, initialY: 70 },
    { label: 'Certifications', icon: Trophy, color: '#fbbf24', delay: 0.8, depth: 0.6, initialX: 60, initialY: 80 },
    { label: 'Portfolio', icon: FileText, color: '#60a5fa', delay: 0.95, depth: 1.3, initialX: 40, initialY: 5 },
  ];

  const FEATURES = [
    { icon: Sparkles, title: 'AI Import & Unification', desc: 'Pull data from LinkedIn, GitHub, Upwork and 22+ networks. Our AI normalises, deduplicates, and enriches every entry automatically.' },
    { icon: LayoutGrid, title: 'Modular Block Engine', desc: 'Drag, snap, and rearrange resume sections as independent blocks. Combine templates and publish multiple variants in seconds.' },
    { icon: Zap, title: 'ATS & SEO Scorecards', desc: 'Real-time scoring against job descriptions. Get actionable keyword gaps, density fixes, and formatting hints before you apply.' },
    { icon: Globe, title: 'Instant Subdomain Publish', desc: 'Go live on yourname.blox.app the moment you hit publish. Custom domains, Open Graph cards, and analytics built-in.' },
    { icon: FileText, title: 'Cover Letter Generator', desc: 'Role-aware AI writes tailored cover letters from your block data. Edit, regenerate, and export to PDF or DOCX in one click.' },
    { icon: Layers, title: '5,000+ Template Pipeline', desc: 'An ever-growing library of recruiter-tested templates across industries. Filter by role, sector, seniority, or visual style.' },
  ];

  const STEPS = [
    { n: '01', title: 'Connect your accounts', desc: 'OAuth import from LinkedIn, GitHub, Dribbble & more in one click.' },
    { n: '02', title: 'AI builds your blocks', desc: 'Claude-powered extraction turns raw data into structured, role-ready sections.' },
    { n: '03', title: 'Snap & customise', desc: 'Drag blocks into any layout. Real-time preview updates as you edit.' },
    { n: '04', title: 'Publish & share', desc: 'One click to a live subdomain. Track views, clicks, and recruiter opens.' },
  ];

  return (
    <div
      className="-mx-4 -my-8 sm:-mx-6 overflow-hidden"
      style={{ background: OBSIDIAN }}
    >
      {/* ── Glow-Flow sidebar ─────────────────────────────────────────────── */}
      <div className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
        {[sec1, sec2, sec3, sec4].map((ref, i) => (
          <GlowDot key={i} sectionRef={ref} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef as React.RefObject<HTMLDivElement>}
        className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-6 py-24"
      >
        <InteractiveGrid />

        {/* Hero copy */}
        <div className="relative z-10 max-w-4xl text-center">
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING_GOD_MODE}
          >
            <div className="flex flex-col items-center gap-4">
              <BloxLogo size={80} pulse />
              <motion.div
                className="rounded-full border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-4 py-1 text-[10px] font-bold tracking-widest text-[#1ECEFA] uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, ...SPRING_GOD_MODE }}
              >
                Hardware Accelerated Portfolio Engine
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            className="font-display text-6xl font-black leading-[0.9] tracking-tighter text-white md:text-9xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...SPRING_GOD_MODE }}
          >
            Your Career,
            <br />
            <span className="text-[#1ECEFA]">Block by Block.</span>
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
            className="mt-12 flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...SPRING_GOD_MODE }}
          >
            <Link href="/signup">
              <motion.span
                className="group relative flex items-center gap-3 overflow-hidden rounded-none bg-[#1ECEFA] px-10 py-5 text-sm font-black text-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRING_GOD_MODE}
              >
                START BUILDING
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Floating blocks (transformed to God-Mode) */}
        {HERO_BLOCKS.map((b) => (
          <HeroBlock key={b.label} {...b} mouseX={mouseX} mouseY={mouseY} />
        ))}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="border-y px-6 py-14" style={{ borderColor: `${CYAN}15`, background: '#0b0f1a' }}>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { n: 25, suffix: '+', label: 'Integrations' },
            { n: 5000, suffix: '+', label: 'Templates' },
            { n: 98, suffix: '%', label: 'ATS pass rate' },
            { n: 2, suffix: ' min', label: 'Avg. setup time' },
          ].map(({ n, suffix, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl font-black" style={{ color: CYAN }}>
                <Counter target={n} suffix={suffix} />
              </p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          AI AUTO-SNAP DEMO
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={sec1 as React.RefObject<HTMLElement>} className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_SOFT}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: CYAN }}>
              See it in action
            </p>
            <h2 className="font-display text-3xl font-black text-white md:text-5xl">
              Paste chaos. Get <span style={{ color: CYAN }}>structure.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400">
              Drop in a raw LinkedIn bio, resume dump, or freeform text. Blox AI extracts, classifies, and snaps every piece into a clean block layout — instantly.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input pane */}
            <motion.div
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{ borderColor: '#1e2535', background: '#0d1120' }}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, ...SPRING_SOFT }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-600">raw_input.txt</span>
              </div>
              <div className="min-h-[140px] font-mono text-sm leading-relaxed text-slate-300">
                {typedText}
                {(demoPhase === 'typing') && (
                  <motion.span
                    className="inline-block h-4 w-0.5 align-middle"
                    style={{ background: CYAN }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
                {demoPhase === 'idle' || demoPhase === 'done' ? (
                  <span className="text-slate-600">{'// your freeform text here...'}</span>
                ) : null}
              </div>
              <motion.button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black"
                style={{ background: CYAN }}
                onClick={runDemo}
                whileHover={{ scale: 1.03, boxShadow: `0 0 24px ${CYAN}70` }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_BOUNCY}
                disabled={demoPhase === 'typing' || demoPhase === 'snapping'}
              >
                <Sparkles size={14} />
                {demoPhase === 'idle' ? 'Auto-Snap with AI' : demoPhase === 'typing' ? 'Processing…' : demoPhase === 'snapping' ? 'Snapping blocks…' : 'Run again'}
              </motion.button>
            </motion.div>

            {/* Blocks pane */}
            <motion.div
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{ borderColor: '#1e2535', background: '#0d1120' }}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, ...SPRING_SOFT }}
            >
              <div className="mb-3 flex items-center gap-2">
                <BloxLogo size={20} />
                <span className="text-xs font-bold text-white/60">blox_output</span>
                <AnimatePresence>
                  {demoPhase === 'done' && (
                    <motion.span
                      className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-black"
                      style={{ background: CYAN }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0 }}
                      transition={SPRING_BOUNCY}
                    >
                      ✓ Snapped
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div
                className="grid gap-2 min-h-[160px]"
                style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 48px)' }}
              >
                <AnimatePresence>
                  {(demoPhase === 'snapping' || demoPhase === 'done') &&
                    DEMO_BLOCKS.map((b, i) => (
                      <DemoBlock key={b.label} {...b} delay={i * 0.1} />
                    ))}
                </AnimatePresence>
                {demoPhase === 'idle' && (
                  <div className="col-span-2 row-span-3 flex items-center justify-center text-xs text-slate-700">
                    blocks appear here
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES (Bento Grid)
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={sec2 as React.RefObject<HTMLElement>} className="px-6 py-32" style={{ background: OBSIDIAN }}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_GOD_MODE}
          >
            <h2 className="font-display text-4xl font-black tracking-tighter text-white md:text-7xl">
              ENGINEERED FOR <span className="text-[#1ECEFA]">PERFORMANCE.</span>
            </h2>
          </motion.div>
          
          <div className="grid gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard 
                key={f.title} 
                {...f} 
                delay={i * 0.05} 
                spark={sparkIndex === i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={sec3 as React.RefObject<HTMLElement>} className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_SOFT}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: CYAN }}>How it works</p>
            <h2 className="font-display text-3xl font-black text-white md:text-5xl">
              From zero to published<br />in four steps.
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div
              className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px md:block"
              style={{ background: `linear-gradient(to bottom, ${CYAN}60, transparent)` }}
            />

            <div className="space-y-10">
              {STEPS.map((step, i) => (
                <StepItem key={step.n} {...step} delay={i * 0.12} />
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
            transition={SPRING_SOFT}
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
                transition={{ delay: i * 0.1, ...SPRING_SOFT }}
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
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_SOFT}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: CYAN }}>Pricing</p>
            <h2 className="font-display text-3xl font-black text-white md:text-5xl">
              Start free. Scale when<br />you're ready.
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: 'Free', price: '$0', period: 'forever', features: ['3 portfolio blocks', 'ATS scanner', '1 subdomain', 'Basic templates'], highlight: false },
              { name: 'Pro', price: '$12', period: '/month', features: ['Unlimited blocks', 'AI generation', 'Custom domains', 'Priority export', 'Advanced analytics'], highlight: true },
              { name: 'Premium', price: '$29', period: '/month', features: ['Everything in Pro', 'White-label', 'API access', 'Team workspaces', 'Dedicated support'], highlight: false },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                className="relative overflow-hidden rounded-2xl border p-6"
                style={{
                  borderColor: plan.highlight ? CYAN : '#1e2535',
                  background: plan.highlight
                    ? `linear-gradient(135deg, ${CYAN}18, rgba(8,11,20,0.95))`
                    : 'linear-gradient(135deg, #111827, #0d1420)',
                  boxShadow: plan.highlight ? `0 0 40px ${CYAN}25` : 'none',
                }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ...SPRING_SOFT }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                {plan.highlight && (
                  <div
                    className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-black text-black"
                    style={{ background: CYAN }}
                  >
                    POPULAR
                  </div>
                )}
                <h3 className="font-display text-base font-bold text-white">{plan.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-4xl font-black text-white">{plan.price}</span>
                  <span className="mb-1 text-sm text-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle size={13} style={{ color: plan.highlight ? CYAN : '#374151' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Free' ? '/signup' : '/pricing'}>
                  <motion.div
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
                    style={
                      plan.highlight
                        ? { background: CYAN, color: '#000' }
                        : { border: `1px solid ${CYAN}30`, color: 'white', background: 'transparent' }
                    }
                    whileHover={{
                      scale: 1.03,
                      boxShadow: plan.highlight ? `0 0 24px ${CYAN}70` : `0 0 12px ${CYAN}30`,
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING_BOUNCY}
                  >
                    Get started <ChevronRight size={14} />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-6 py-28 text-center"
        style={{ background: '#080b14' }}
      >
        {/* Glow behind */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 600, height: 600, background: `radial-gradient(circle, ${CYAN}14 0%, transparent 70%)` }}
        />
        <motion.div
          className="relative z-10 mx-auto max-w-2xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING_SOFT}
        >
          <div className="mb-6 flex justify-center">
            <BloxLogo size={56} />
          </div>
          <h2 className="font-display text-4xl font-black text-white md:text-6xl">
            Your career, <span style={{ color: CYAN }}>assembled.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-slate-400">
            Join thousands of freelancers, job seekers, and pros who already publish with Blox.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <motion.span
                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-black text-black"
                style={{ background: CYAN }}
                whileHover={{ scale: 1.06, boxShadow: `0 0 40px ${CYAN}80` }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_BOUNCY}
              >
                Start building — it's free
                <ArrowRight size={15} />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
