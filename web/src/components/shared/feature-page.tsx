'use client';

import { PlanTier } from '@nextjs-blox/shared-types';
import { ReactNode } from 'react';
import { TierGate } from './tier-gate';

interface FeaturePageProps {
  title: string;
  description: string;
  minTier?: PlanTier;
  children?: ReactNode;
  className?: string;
  headerIcon?: ReactNode;
}

export function FeaturePage({ title, description, minTier, children, className }: FeaturePageProps) {
  return (
    <TierGate minTier={minTier}>
      <section className={`mx-auto max-w-7xl space-y-7 ${className ?? ''}`}>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
          <p className="text-[13px] text-[#4E5C6E] leading-relaxed">{description}</p>
        </div>
        {children}
      </section>
    </TierGate>
  );
}
