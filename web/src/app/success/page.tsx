'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { billingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const updateUser = useBloxStore((s) => s.updateUser);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    const reference = params.get('reference') ?? params.get('trxref');
    if (!reference) {
      setVerifying(false);
      return;
    }
    billingApi.verifyPayment?.(reference)
      .then((data) => {
        const result = data as { tier: PlanTier; status: string };
        if (result.status === 'success' || result.tier) {
          setPlan(result.tier);
          updateUser({ tier: result.tier });
        }
      })
      .catch(() => setError('Could not verify payment. Please contact support if you were charged.'))
      .finally(() => setVerifying(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (verifying) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-600 text-sm">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <h1 className="text-xl font-black text-red-900">Payment verification failed</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/help" className="rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white">Contact support</Link>
            <Link href="/dashboard" className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700">Go to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <section className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-10 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-emerald-900">
          {plan ? `${plan} plan activated!` : 'Subscription activated!'}
        </h1>
        <p className="mt-2 text-sm text-emerald-800">
          Welcome aboard. Your premium features are now unlocked and ready to use.
        </p>

        {/* What&apos;s next */}
        <div className="mt-7 rounded-xl border border-green-200 bg-white p-5 text-left">
          <h2 className="text-sm font-bold text-slate-900 mb-3">What to do next:</h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2"><span className="font-bold text-emerald-600">1.</span> Create or import your assets in the dashboard</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-600">2.</span> Run the AI scanner to optimise for jobs</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-600">3.</span> Publish your portfolio with a custom subdomain</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-600">4.</span> Explore the template marketplace for premium designs</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard"
            className="rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
            Go to dashboard
          </Link>
          <Link href="/templates"
            className="rounded-md border border-emerald-400 px-6 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
            Explore templates
          </Link>
          <Link href="/portfolios/new"
            className="rounded-md border border-emerald-400 px-6 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
            Create portfolio
          </Link>
        </div>
      </section>
    </div>
  );
}
