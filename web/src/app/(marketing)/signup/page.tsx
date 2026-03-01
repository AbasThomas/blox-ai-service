'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Persona, PlanTier } from '@nextjs-blox/shared-types';
import { Bot, Mail, Lock, User, ArrowRight } from 'lucide-react';
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

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
      const errs = validate();
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
    [form, validate, login, router],
  );

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-6 py-12" style={{ background: '#0C0F13' }}>
      {/* Background layer */}
      <div className="absolute inset-0">
        <HexagonBackground 
          hexagonSize={50} 
          hexagonMargin={2} 
          glowColor="rgba(30, 206, 250, 0.45)" 
          className="opacity-70"
          proximity={350}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Brand Icon */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#1ECEFA] backdrop-blur-xl transition-all hover:scale-110 hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/10 hover:shadow-[0_0_30px_rgba(30,206,250,0.3)]">
            <Bot size={28} />
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#161B22]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
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

            {/* Persona Selector */}
            <div className="mt-6">
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

            <button
              type="submit"
              disabled={loading}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-3 text-sm font-bold text-black transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? 'INITIALIZING...' : 'CREATE IDENTITY'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs tracking-widest uppercase font-bold text-slate-500"><span className="bg-[#161B22] px-4">OR USE</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`${apiBase}/v1/auth/google`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
              aria-label="Continue with Google">
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <a href={`${apiBase}/v1/auth/linkedin`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10 hover:text-white"
              aria-label="Continue with LinkedIn">
              <svg className="h-4 w-4 fill-[#0A66C2]" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already verified?{' '}
          <Link href="/login" className="font-bold text-[#1ECEFA] transition-colors hover:text-white">Access Portal</Link>
        </p>
      </div>
    </div>
  );
}
