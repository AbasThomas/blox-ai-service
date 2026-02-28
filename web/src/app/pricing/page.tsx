'use client';

import Link from 'next/link';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';

const PLANS = [
  {
    tier: PlanTier.FREE,
    label: 'Free',
    monthly: 0,
    annual: 0,
    color: 'border-slate-200',
    features: ['3 assets', 'Basic templates', 'Blox subdomain', 'Community support'],
    missing: ['AI generation', 'Custom domain', 'Analytics', 'ATS scanner'],
  },
  {
    tier: PlanTier.PRO,
    label: 'Pro',
    monthly: 9.99,
    annual: 7.99,
    color: 'border-blue-500',
    badge: 'Most popular',
    features: ['25 assets', 'AI generation', 'ATS scanner', 'Analytics dashboard',
      'Custom domain', '50 template forks', 'Priority support'],
    missing: ['Collaboration', 'Mock interviews', 'White-label'],
  },
  {
    tier: PlanTier.PREMIUM,
    label: 'Premium',
    monthly: 24.99,
    annual: 19.99,
    color: 'border-purple-500',
    features: ['Unlimited assets', 'Everything in Pro', 'Collaboration & comments',
      'Mock interview simulator', 'Career coach', 'Auto-apply jobs', 'Priority AI queue'],
    missing: ['White-label', 'API access'],
  },
  {
    tier: PlanTier.ENTERPRISE,
    label: 'Enterprise',
    monthly: 99,
    annual: 79,
    color: 'border-amber-500',
    features: ['Everything in Premium', 'White-label branding', 'API access',
      'Admin dashboard', 'SSO', 'Audit logs', 'Dedicated support'],
    missing: [],
  },
] as const;

export default function PricingPage() {
  const user = useBloxStore((s) => s.user);

  return (
    <section className="py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Simple, transparent pricing</h1>
        <p className="text-slate-500 text-base">Start free, upgrade when you need more power.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = user.tier === plan.tier;
          return (
            <div key={plan.tier}
              className={`rounded-2xl border-2 bg-white p-6 flex flex-col shadow-sm ${plan.color} relative`}>
              {'badge' in plan && plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">
                  {plan.badge}
                </span>
              )}
              <div className="mb-4">
                <h2 className="text-lg font-black text-slate-900">{plan.label}</h2>
                <div className="mt-2">
                  {plan.monthly === 0 ? (
                    <p className="text-3xl font-black text-slate-900">Free</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-black text-slate-900">${plan.monthly}<span className="text-base font-normal text-slate-500">/mo</span></p>
                      <p className="text-xs text-slate-400">${plan.annual}/mo billed annually</p>
                    </div>
                  )}
                </div>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span className="text-slate-700">{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                    <span className="text-slate-400 shrink-0 mt-0.5">✗</span>
                    <span className="text-slate-500">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <span className="block rounded-md border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-500">
                  Current plan
                </span>
              ) : plan.monthly === 0 ? (
                <Link href="/signup"
                  className="block rounded-md border border-slate-900 px-4 py-2.5 text-center text-sm font-bold text-slate-900 hover:bg-slate-50">
                  Get started free
                </Link>
              ) : (
                <Link href={`/checkout?tier=${plan.tier}`}
                  className={`block rounded-md px-4 py-2.5 text-center text-sm font-bold text-white ${
                    plan.tier === PlanTier.PRO ? 'bg-blue-600 hover:bg-blue-700' :
                    plan.tier === PlanTier.PREMIUM ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-amber-600 hover:bg-amber-700'
                  }`}>
                  Upgrade to {plan.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-xl font-bold text-slate-900 text-center">Frequently asked questions</h2>
        {[
          ['Can I switch plans?', 'Yes. Upgrade or downgrade at any time. Unused days are prorated.'],
          ['What payment methods are accepted?', 'We accept all major cards and bank transfers via Paystack.'],
          ['Is there a free trial?', 'Yes — all new accounts start with a 7-day Pro trial, no card required.'],
          ['Can I cancel anytime?', 'Absolutely. Cancel from Settings → Subscription. Your plan stays active until the end of the billing period.'],
        ].map(([q, a]) => (
          <details key={q} className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-semibold text-sm text-slate-900">{q}</summary>
            <p className="mt-2 text-sm text-slate-600">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
