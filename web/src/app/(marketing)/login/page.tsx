'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';
import { Bot, Mail, Lock, ArrowRight, Google, Linkedin } from '@/components/ui/icons';
import { HexagonBackground } from '@/components/shared/hexagon-background';

export default function LoginPage() {
  const router = useRouter();
  const login = useBloxStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Icon */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#1ECEFA] backdrop-blur-xl transition-all hover:scale-110 hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/10 hover:shadow-[0_0_30px_rgba(30,206,250,0.3)]">
            <Bot size={28} />
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#161B22]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
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
                <Link href="/forgot-password" className="text-xs text-[#1ECEFA] transition-colors hover:text-white">Forgot sequence?</Link>
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
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-3 text-sm font-bold text-black transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS PORTAL'}
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

        <p className="mt-8 text-center text-sm text-slate-500">
          Not initialized yet?{' '}
          <Link href="/signup" className="font-bold text-[#1ECEFA] transition-colors hover:text-white">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
