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

export function FeaturePage({ title, description, minTier, children, className, headerIcon }: FeaturePageProps) {
  return (
    <TierGate minTier={minTier}>
      <section className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 ${className || ''}`}>
        <div className="flex items-start gap-4 pb-6 border-b border-white/10">
          {headerIcon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 shadow-[0_0_15px_rgba(30,206,250,0.15)] text-[#1ECEFA]">
              {headerIcon}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
          </div>
        </div>
        
        <div className="rounded-3xl border border-white/10 bg-[#161B22]/60 p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          {children}
        </div>
      </section>
    </TierGate>
  );
}

