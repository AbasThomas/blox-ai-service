'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new link.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-8">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {done ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Password reset!</h1>
            <p className="text-sm text-slate-600">Your password has been updated. Redirecting to login...</p>
            <Link href="/login" className="inline-block rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Set new password</h1>
              <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">New password</label>
                <input id="password" type="password" autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  disabled={!token}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  placeholder="At least 8 characters" />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">Confirm password</label>
                <input id="confirm" type="password" autoComplete="new-password" required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  disabled={!token}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  placeholder="Repeat your new password" />
              </div>
              <button type="submit" disabled={loading || !token}
                className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600">
              <Link href="/login" className="font-semibold text-slate-900">Back to login</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
