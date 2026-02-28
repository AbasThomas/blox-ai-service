import Link from 'next/link';
import { PRICING_OPTIONS } from '@/lib/pricing';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm md:p-12">
        <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          AI-powered professional brand builder
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
          Build a portfolio, resume, and cover letter stack in under 2 minutes.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600">
          Blox unifies data from 25+ networks, generates role-specific assets, optimizes for SEO + ATS,
          and publishes instantly to subdomains or custom domains.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-md bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            Start free
          </Link>
          <Link href="/dashboard" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold">
            View demo dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          'AI import + unification from professional networks',
          'Template engine with 5k+ variant pipeline',
          'ATS + SEO scorecards with actionable fixes',
        ].map((feature) => (
          <article key={feature} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">{feature}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Optimized workflows for freelancers, job seekers, professionals, students, and enterprise teams.
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black">Pricing</h2>
        <p className="mt-1 text-sm text-slate-600">Choose monthly, 6-month, or annual billing and save more on long cycles.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {PRICING_OPTIONS.map((plan) => (
            <div key={`${plan.tier}-${plan.cycle}`} className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">{plan.label}</h3>
              <p className="mt-2 text-2xl font-black">${plan.amount.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">{plan.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

