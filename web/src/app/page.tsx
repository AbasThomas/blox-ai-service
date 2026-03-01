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
  Star,
  CheckCircle,
  Layers,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { InteractiveGridPattern } from '../components/shared/interactive-grid-pattern';
import { SpotlightButton } from '../components/shared/spotlight-button';
import { GridShineButton } from '../components/shared/grid-shine-button';

// ── brand token ──────────────────────────────────────────────────────────────
const CYAN = '#1ECEFA';
const OBSIDIAN = '#0C0F13';
const SURFACE = '#161B22';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const sec1 = useRef<HTMLElement>(null);
  const sec2 = useRef<HTMLElement>(null);
  const sec3 = useRef<HTMLElement>(null);
  const sec4 = useRef<HTMLElement>(null);

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

  const DEMO_BLOCKS = [
    { label: 'Experience', col: 1, row: 1 },
    { label: 'Skills', col: 2, row: 1 },
    { label: 'Projects', col: 1, row: 2 },
    { label: 'Education', col: 2, row: 2 },
    { label: 'Open Source', col: 1, row: 3 },
    { label: 'Achievements', col: 2, row: 3 },
  ];

  const FEATURES = [
    { icon: Sparkles, title: 'AI Import & Unification', desc: 'Pull data from LinkedIn, GitHub, Upwork and 22+ networks. Our AI normalises, deduplicates, and enriches every entry automatically.' },
    { icon: LayoutGrid, title: 'Modular Block Engine', desc: 'Drag, snap, and rearrange resume sections as independent blocks. Combine templates and publish multiple variants in seconds.' },
    { icon: Zap, title: 'ATS & SEO Scorecards', desc: 'Real-time scoring against job descriptions. Get actionable keyword gaps, density fixes, and formatting hints before you apply.' },
    { icon: Globe, title: 'Instant Subdomain Publish', desc: 'Go live on yourname.blox.app the moment you hit publish. Custom domains, Open Graph cards, and analytics built-in.' },
    { icon: FileText, title: 'Cover Letter Generator', desc: 'Role-aware AI writes tailored cover letters from your block data. Edit, regenerate, and export to PDF or DOCX in one click.' },
    { icon: Layers, title: '5,000+ Template Pipeline', desc: 'An ever-growing library of recruiter-tested templates across industries. Filter by role, sector, seniority, or visual style.' },
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


  return (
    <div
      className="overflow-hidden"
      style={{ background: OBSIDIAN }}
    >

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-6 py-24">
        <InteractiveGridPattern className="absolute inset-0" />

        {/* Hero copy */}
        <div className="relative z-10 max-w-4xl text-center">
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
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...SPRING_GOD_MODE }}
          >
            <div className="w-[200px]">
              <SpotlightButton href="/signup" className="w-full">Get Started</SpotlightButton>
            </div>
            <GridShineButton href="/pricing" className="w-[200px]">Book Your Call</GridShineButton>
          </motion.div>
        </div>
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
            transition={SPRING_GOD_MODE}
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
              transition={{ delay: 0.1, ...SPRING_GOD_MODE }}
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
                transition={SPRING_GOD_MODE}
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
              transition={{ delay: 0.2, ...SPRING_GOD_MODE }}
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
                      transition={SPRING_GOD_MODE}
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
          SCROLL-ASSEMBLED RESUME (Section 3)
      ══════════════════════════════════════════════════════════════════════ */}
      <div ref={containerRef} className="relative h-[300vh]">
        <section ref={sec3 as React.RefObject<HTMLElement>} className="sticky top-0 h-screen overflow-hidden">
          <div className="flex h-full items-center justify-center p-6">
            <motion.div
              className="absolute z-0 text-center"
              style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
            >
              <h2 className="font-display text-4xl font-black tracking-tighter text-white md:text-7xl">
                YOUR RESUME, <span className="text-[#1ECEFA]">ASSEMBLED.</span>
              </h2>
            </motion.div>

            <div className="relative h-[550px] w-[380px] border border-white/10 bg-[#161B22]/50 backdrop-blur-xl">
              {/* Central Portfolio Preview */}
              <div className="p-8">
                <div className="mb-6 h-4 w-1/3 bg-white/10" />
                <div className="mb-2 h-2 w-full bg-white/5" />
                <div className="mb-2 h-2 w-full bg-white/5" />
                <div className="mb-8 h-2 w-2/3 bg-white/5" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-white/5" />
                  <div className="h-24 bg-white/5" />
                </div>
              </div>

              {/* Floating UI Elements */}
              {[
                { label: "Experience", x: -350, y: -180, rot: -12 },
                { label: "Skill: React", x: 350, y: -250, rot: 8 },
                { label: "Stripe.png", x: -400, y: 80, rot: 4 },
                { label: "Education", x: 400, y: 250, rot: -8 },
                { label: "Skill: Python", x: -250, y: 350, rot: 15 },
              ].map((el, i) => {
                const progressStart = 0.2 + (i * 0.1);
                const progressEnd = progressStart + 0.2;
                
                const xTransform = useTransform(scrollYProgress, [progressStart, progressEnd], [el.x, 0]);
                const yTransform = useTransform(scrollYProgress, [progressStart, progressEnd], [el.y, 0]);
                const rotateTransform = useTransform(scrollYProgress, [progressStart, progressEnd], [el.rot, 0]);
                const opacityTransform = useTransform(scrollYProgress, [progressStart, progressEnd - 0.05, progressEnd], [0, 1, 1]);

                return (
                  <motion.div
                    key={el.label}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-none border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-4 py-2 text-[10px] font-bold text-[#1ECEFA] uppercase"
                    style={{
                      x: xTransform,
                      y: yTransform,
                      rotate: rotateTransform,
                      opacity: opacityTransform,
                    }}
                  >
                    {el.label}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

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
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING_GOD_MODE}
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
                transition={{ delay: i * 0.1, ...SPRING_GOD_MODE }}
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
                    transition={SPRING_GOD_MODE}
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
