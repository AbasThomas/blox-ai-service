'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';
import { Logo } from '@/components/ui/logo';
import { Mail, Lock, ArrowRight, Google, Linkedin, CheckCircle2 } from '@/components/ui/icons';
import { HexagonBackground } from '@/components/shared/hexagon-background';

export default function LoginPage() {
  const router = useRouter();
  const login = useBloxStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSpotlightMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  }, []);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password }) as {
        mfaRequired?: boolean;
        challengeToken?: string;
        user?: { id: string; fullName: string; email: string; tier: PlanTier; persona: string };
        accessToken?: string;
        refreshToken?: string;
      };

      if (res.mfaRequired) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mfa_challenge_token', res.challengeToken ?? '');
          sessionStorage.setItem('mfa_email', email);
        }
        router.push('/mfa');
        return;
      }

      login(
        { accessToken: res.accessToken!, refreshToken: res.refreshToken! },
        {
          id: res.user!.id,
          name: res.user!.fullName,
          email: res.user!.email,
          tier: res.user!.tier ?? PlanTier.FREE,
          persona: res.user!.persona as never,
        },
      );
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, router]);

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
        <div className="w-full max-w-md relative z-10 pt-16 pb-12 lg:py-12">
          {/* Show vertical logo on mobile only */}
          <div className="mb-8 flex justify-center lg:hidden relative z-10">
            <Link href="/" className="group inline-block transition-transform hover:scale-105">
              <Logo size="xl" layout="vertical" />
            </Link>
          </div>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#161B22]/80 p-8 shadow-sm backdrop-blur-xl relative z-10">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-black tracking-tight text-white">Welcome back.</h1>
            <p className="mt-2 text-sm text-slate-400">Initialize your deployed identity.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} aria-label="Login form" noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#1ECEFA] focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#1ECEFA] transition-colors hover:text-white">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#1ECEFA] focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
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
                {loading ? 'Logging in...' : 'Login'}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </span>
            </button>
          </form>

          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs tracking-widest uppercase font-bold text-slate-500"><span className="bg-[#161B22] px-4">OR USE</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`${apiBase}/v1/auth/google`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
              aria-label="Login with Google">
              <Google className="h-4 w-4 text-[#4285F4]" />
              Google
            </a>
            <a href={`${apiBase}/v1/auth/linkedin`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10 hover:text-white"
              aria-label="Login with LinkedIn">
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </a>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-slate-500 relative z-10">
          Don't have an account yet?{' '}
          <Link href="/signup" className="font-bold text-[#1ECEFA] transition-colors hover:text-white">Create an account</Link>
        </p>
        </div>
      </div>
    </div>
  );
}

