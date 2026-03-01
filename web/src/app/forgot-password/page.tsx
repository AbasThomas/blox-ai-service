'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { Bot, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { HexagonBackground } from '@/components/shared/hexagon-background';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          {sent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 shadow-[0_0_30px_rgba(30,206,250,0.2)]">
                <CheckCircle2 className="h-10 w-10 text-[#1ECEFA]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-white">Sequence Initiated</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  If <strong className="text-white">{email}</strong> exists in our system, you will receive encrypted reset instructions inside your inbox shortly.
                </p>
              </div>
              <Link href="/login" className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-all hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/10 hover:text-[#1ECEFA]">
                RETURN TO GATEWAY
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="font-display text-3xl font-black tracking-tight text-white">Reset Password</h1>
                <p className="mt-2 text-sm text-slate-400">Enter your core identifier to request a reset.</p>
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
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-3 text-sm font-bold text-black transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? 'TRANSMITTING...' : 'SEND RESET LINK'}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-white">
                  BACK TO LOGIN
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

