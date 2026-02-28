'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { billingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { PRICING_OPTIONS } from '@/lib/pricing';
import { PlanTier } from '@nextjs-blox/shared-types';

export default function CheckoutPage() {
  const params = useSearchParams();
  const user = useBloxStore((s) => s.user);
  const tierParam = params.get('tier') as PlanTier | null;

  // Filter options to the tier from URL or show all upgradeable plans
  const options = PRICING_OPTIONS.filter((p) =>
    tierParam ? p.tier === tierParam : p.tier !== PlanTier.FREE
  );

  const [selected, setSelected] = useState(options[0] ?? PRICING_OPTIONS[0]);
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (options[0]) setSelected(options[0]);
  }, [tierParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await billingApi.createCheckout({
        tier: selected.tier,
        cycle: selected.cycle,
        email: user.email,
        currency: 'usd',
        coupon: coupon.trim() || undefined,
      }) as { authorizationUrl: string; reference: string };
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const savings: Record<string, string> = {
    MONTHLY: '',
    SEMI_ANNUAL: 'Save 10%',
    ANNUAL: 'Save 20%',
  };

  return (
    <FeaturePage title="Checkout" description="Secure payment via Paystack. Cancel anytime.">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Plan picker */}
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Choose your plan</h2>
            <div className="space-y-2">
              {options.map((plan) => (
                <button key={`${plan.tier}-${plan.cycle}`} type="button" onClick={() => setSelected(plan)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
                    selected.tier === plan.tier && selected.cycle === plan.cycle
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900">${plan.amount.toFixed(2)}</p>
                      {savings[plan.cycle] && (
                        <span className="text-xs font-medium text-green-600">{savings[plan.cycle]}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Coupon code (optional)</label>
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="PROMO20"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Order summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-medium text-slate-900">{selected.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Billing</dt>
                <dd className="font-medium text-slate-900">{selected.note}</dd>
              </div>
              {coupon && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Coupon</dt>
                  <dd className="font-medium text-green-600">{coupon}</dd>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <dt className="font-bold text-slate-900">Total</dt>
                <dd className="font-black text-slate-900 text-lg">${selected.amount.toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <button onClick={handleCheckout} disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-opacity">
            {loading ? 'Redirecting to Paystack...' : `Pay $${selected.amount.toFixed(2)} with Paystack`}
          </button>

          <div className="space-y-2 text-xs text-slate-400 text-center">
            <p>🔒 Secured by Paystack — PCI DSS Level 1 compliant</p>
            <p>Cancel anytime from Settings → Subscription</p>
            <p>7-day money-back guarantee</p>
          </div>

          {/* What you get */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-700 mb-2">Included with {selected.label}:</p>
            <ul className="space-y-1 text-xs text-slate-600">
              {selected.tier === PlanTier.PRO && (
                <>
                  <li>✓ 25 assets</li>
                  <li>✓ AI generation &amp; critique</li>
                  <li>✓ ATS scanner</li>
                  <li>✓ Custom domain</li>
                  <li>✓ Analytics dashboard</li>
                </>
              )}
              {selected.tier === PlanTier.PREMIUM && (
                <>
                  <li>✓ Everything in Pro</li>
                  <li>✓ Unlimited assets</li>
                  <li>✓ Collaboration &amp; comments</li>
                  <li>✓ Mock interview simulator</li>
                  <li>✓ AI career coach</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
