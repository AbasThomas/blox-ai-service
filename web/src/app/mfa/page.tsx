'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';

export default function MfaPage() {
  const router = useRouter();
  const login = useBloxStore((s) => s.login);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[i] = val.slice(-1);
    setDigits(newDigits);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const challengeToken = typeof window !== 'undefined' ? sessionStorage.getItem('mfa_challenge_token') ?? '' : '';
      const res = await authApi.verifyMfa(code, challengeToken) as {
        verified: boolean;
        user?: { id: string; fullName: string; email: string; tier: PlanTier; persona: string };
        accessToken?: string;
        refreshToken?: string;
      };

      if (res.verified && res.accessToken) {
        login(
          { accessToken: res.accessToken, refreshToken: res.refreshToken! },
          { id: res.user!.id, name: res.user!.fullName, email: res.user!.email, tier: res.user!.tier ?? PlanTier.FREE, persona: res.user!.persona as never },
        );
        sessionStorage.removeItem('mfa_challenge_token');
        router.push('/dashboard');
      } else if (res.verified) {
        router.push('/settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-8">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Two-factor authentication</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}

        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-10 rounded-lg border border-slate-300 text-center text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <button onClick={handleVerify} disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
          {loading ? 'Verifying...' : 'Verify code'}
        </button>
      </section>
    </div>
  );
}

