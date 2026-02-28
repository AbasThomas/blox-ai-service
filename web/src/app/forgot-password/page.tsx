'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authApi } from '@/lib/api';

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
    <div className="mx-auto max-w-xl py-8">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Check your email</h1>
            <p className="text-sm text-slate-600">
              If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
            </p>
            <Link href="/login" className="inline-block rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Reset password</h1>
              <p className="mt-1 text-sm text-slate-500">Enter your email and we&apos;ll send a secure reset link.</p>
            </div>
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send reset link'}
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

