'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { Logo } from '@/components/ui/logo';
import { Mail, ArrowRight, CheckCircle2 } from '@/components/ui/icons';
import { HexagonBackground } from '@/components/shared/hexagon-background';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSpotlightMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#161B22]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl relative z-10">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 shadow-[0_0_30px_rgba(30,206,250,0.2)]">
                <CheckCircle2 className="h-10 w-10 text-[#1ECEFA]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-white">Email Sent</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  If <strong className="text-white">{email}</strong> is registered, you'll receive reset instructions shortly.
                </p>
              </div>
              <Link href="/login" className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-all hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/10 hover:text-[#1ECEFA]">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="font-display text-3xl font-black tracking-tight text-white">Reset Password</h1>
                <p className="mt-2 text-sm text-slate-400">Enter your email to reset your password.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#1ECEFA] focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]"
                      placeholder="name@domain.com"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  onMouseMove={handleSpotlightMove}
                  className="mt-8 hero-spotlight-btn hero-spotlight-btn-primary group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border bg-[rgba(20,20,20,0.6)] px-8 py-[0.9rem] text-[0.9rem] uppercase tracking-[0.12em] text-[#c6e3ff] backdrop-blur-[6px] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50"
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
                    {loading ? 'Sending...' : 'Reset Password'}
                    {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </span>
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-white">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
