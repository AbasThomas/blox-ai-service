
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Persona, PlanTier } from '@nextjs-blox/shared-types';
import { Logo } from '@/components/ui/logo';
import { Mail, Lock, User, ArrowRight, Google, Linkedin, CheckCircle2 } from '@/components/ui/icons';
import { HexagonBackground } from '@/components/shared/hexagon-background';

type SignupPersona =
  | Persona.FREELANCER
  | Persona.JOB_SEEKER
  | Persona.DESIGNER
  | Persona.DEVELOPER
  | Persona.STUDENT
  | Persona.EXECUTIVE;

const PERSONAS: { value: SignupPersona; label: string; desc: string }[] = [
  { value: Persona.FREELANCER, label: 'Freelancer', desc: 'Client work & portfolio' },
  { value: Persona.JOB_SEEKER, label: 'Job Seeker', desc: 'Resumes & applications' },
  { value: Persona.DESIGNER, label: 'Designer', desc: 'Portfolio-first layout' },
  { value: Persona.DEVELOPER, label: 'Developer', desc: 'Projects & technical depth' },
  { value: Persona.STUDENT, label: 'Student', desc: 'First jobs & internships' },
  { value: Persona.EXECUTIVE, label: 'Executive', desc: 'Leadership & outcomes' },
];

export default function SignupPage() {
  const router = useRouter();
  const login = useBloxStore((state) => state.login);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    persona: Persona.JOB_SEEKER as SignupPersona,
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [step, setStep] = useState(1);

  const validateStep1 = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  }, [form]);

  const validateStep2 = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.acceptTerms) errs.acceptTerms = 'You must accept the terms';
    return errs;
  }, [form]);

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (step === 1) {
        const errs = validateStep1();
        if (Object.keys(errs).length > 0) {
          setErrors(errs);
          return;
        }
        setStep(2);
        return;
      }

      const errs = validateStep2();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      
      setLoading(true);
      setServerError('');
      try {
        const result = (await authApi.signup({
          fullName: form.name,
          name: form.name,
          email: form.email,
          password: form.password,
          persona: form.persona,
        })) as { accessToken: string; refreshToken: string; user: { id: string; name?: string; fullName?: string; email: string; tier: PlanTier; persona: string } };

        login(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          {
            id: result.user.id,
            name: result.user.fullName ?? result.user.name ?? form.name,
            email: result.user.email,
            tier: result.user.tier ?? PlanTier.FREE,
            persona: result.user.persona as SignupPersona,
          },
        );
        router.push('/dashboard');
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [form, validateStep1, validateStep2, step, login, router],
  );

  const handleSpotlightMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  }, []);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  return (
    <div className="flex min-h-screen bg-[#0C0F13] relative overflow-hidden">
      {/* Global Background layer */}
      <div className="absolute inset-0 z-0">
        <HexagonBackground 
          hexagonSize={60} 
          hexagonMargin={2} 
          glowColor="rgba(30, 206, 250, 0.15)" 
          className="opacity-50"
          proximity={400}
        />
      </div>

      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/10 p-12 lg:flex lg:p-16 z-10">
        
        {/* Branding */}
        <div className="relative z-10">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo size="xl" layout="horizontal" />
          </Link>
        </div>

        {/* Bullet Points */}
        <div className="relative z-10 max-w-lg">
          <h2 className="mb-8 font-display text-4xl font-black tracking-tight text-white leading-tight">
            Deploy your professional identity.
          </h2>
          <ul className="space-y-5 text-slate-300 ml-1">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#1ECEFA]" />
              <span className="font-medium text-lg">AI-powered layout generation.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#1ECEFA]" />
              <span className="font-medium text-lg">Magnetic micro-interactions.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#1ECEFA]" />
              <span className="font-medium text-lg">Detailed visitor analytics.</span>
            </li>
          </ul>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Blox, Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 overflow-y-auto">
        <div className="w-full max-w-xl relative z-10 pt-16 pb-12 lg:py-12">
          {/* Show vertical logo on mobile only */}
          <div className="mb-8 flex justify-center lg:hidden relative z-10">
            <Link href="/" className="group inline-block transition-transform hover:scale-105">
              <Logo size="xl" layout="vertical" />
            </Link>
          </div>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#161B22]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl relative z-10">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-black tracking-tight text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">Initialize your professional profile.</p>
          </div>

          {serverError && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
              {serverError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} aria-label="Sign up form" noValidate>
            
            {step === 1 ? (
              <>
                {/* Split Name and Email Row */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="name" type="text" autoComplete="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
                        className={`block w-full rounded-xl border bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                          errors.name ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400' : 'border-white/10 focus:border-[#1ECEFA] focus:ring-[#1ECEFA]'
                        }`}
                        placeholder="Jane Doe"
                      />
                    </div>
                    {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                        className={`block w-full rounded-xl border bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                          errors.email ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400' : 'border-white/10 focus:border-[#1ECEFA] focus:ring-[#1ECEFA]'
                        }`}
                        placeholder="name@domain.com"
                      />
                    </div>
                    {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                {/* Split Passwords Row */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => handleChange('password', e.target.value)}
                        className={`block w-full rounded-xl border bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                          errors.password ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400' : 'border-white/10 focus:border-[#1ECEFA] focus:ring-[#1ECEFA]'
                        }`}
                        placeholder="At least 8 characters"
                      />
                    </div>
                    {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Confirm Password</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className={`block w-full rounded-xl border bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                          errors.confirmPassword ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400' : 'border-white/10 focus:border-[#1ECEFA] focus:ring-[#1ECEFA]'
                        }`}
                        placeholder="Verify sequence"
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  onMouseMove={handleSpotlightMove}
                  className="mt-8 hero-spotlight-btn hero-spotlight-btn-primary group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border bg-[rgba(20,20,20,0.6)] px-8 py-[0.9rem] text-[0.9rem] uppercase tracking-[0.12em] text-[#c6e3ff] backdrop-blur-[6px] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
                  <span className="relative pointer-events-none flex items-center justify-center gap-2">
                    CONTINUE TO NEXT SECTION
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* Persona Selector */}
                <div>
                  <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-400">Select Profile Origin</span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleChange('persona', p.value)}
                        aria-pressed={form.persona === p.value}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          form.persona === p.value
                            ? 'border-[#1ECEFA]/50 bg-[#1ECEFA]/10 shadow-[0_0_15px_rgba(30,206,250,0.15)]'
                            : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        <p className={`text-sm font-bold ${form.persona === p.value ? 'text-[#1ECEFA]' : 'text-slate-300'}`}>{p.label}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-6 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-[#1ECEFA] focus:ring-[#1ECEFA] focus:ring-offset-0"
                    checked={form.acceptTerms}
                    onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                  />
                  <span className="text-slate-400">
                    I agree to the{' '}
                    <Link href="/terms" className="font-bold text-[#1ECEFA] hover:text-white transition-colors">Terms of Service</Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="font-bold text-[#1ECEFA] hover:text-white transition-colors">Privacy Policy</Link>
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-xs text-red-400">{errors.acceptTerms}</p>}

                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/5"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    onMouseMove={handleSpotlightMove}
                    className="hero-spotlight-btn hero-spotlight-btn-primary group relative flex-1 inline-flex w-full items-center justify-center overflow-hidden rounded-full border bg-[rgba(20,20,20,0.6)] px-8 py-[0.9rem] text-[0.9rem] uppercase tracking-[0.12em] text-[#c6e3ff] backdrop-blur-[6px] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50"
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
                    <span className="relative pointer-events-none flex items-center justify-center gap-2">
                      {loading ? 'Creating Account...' : 'Create Account'}
                      {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                    </span>
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs tracking-widest uppercase font-bold text-slate-500"><span className="bg-[#161B22] px-4">OR USE</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`${apiBase}/v1/auth/google`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
              aria-label="Continue with Google">
              <Google className="h-4 w-4 text-[#4285F4]" />
              Google
            </a>
            <a href={`${apiBase}/v1/auth/linkedin`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10 hover:text-white"
              aria-label="Continue with LinkedIn">
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </a>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-slate-500 relative z-10">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#1ECEFA] transition-colors hover:text-white">Sign In</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
