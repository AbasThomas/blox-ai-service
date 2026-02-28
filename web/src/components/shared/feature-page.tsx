'use client';

import { PlanTier } from '@nextjs-blox/shared-types';
import { ReactNode } from 'react';
import { TierGate } from './tier-gate';

interface FeaturePageProps {
  title: string;
  description: string;
  minTier?: PlanTier;
  children?: ReactNode;
}

export function FeaturePage({ title, description, minTier, children }: FeaturePageProps) {
  return (
    <TierGate minTier={minTier}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      </section>
    </TierGate>
  );
}

