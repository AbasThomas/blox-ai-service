'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';

type ExperienceItem = PublicProfilePayload['sections']['experience'][number];

interface ExperienceTimelineProps {
  items: ExperienceItem[];
  accentColor?: string;
  lineColor?: string;
  cardBg?: string;
  textColor?: string;
  mutedColor?: string;
  companyColor?: string;
}

export function ExperienceTimeline({
  items,
  accentColor = '#1ECEFA',
  lineColor = 'rgba(30,206,250,0.15)',
  cardBg = 'rgba(19,26,35,0.8)',
  textColor = '#E2E8F0',
  mutedColor = '#64748b',
  companyColor = '#1ECEFA',
}: ExperienceTimelineProps) {
  const reduced = useReducedMotion();

  if (!items.length) return null;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        aria-hidden
        style={{ background: lineColor }}
        className="absolute left-[11px] top-2 bottom-2 w-px"
      />

      <ol className="space-y-6 pl-7" aria-label="Experience timeline">
        {items.map((exp, i) => (
          <motion.li
            key={`${exp.role}-${i}`}
            initial={reduced ? {} : { opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-48px' }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Dot */}
            <span
              aria-hidden
              style={{
                background: accentColor,
                boxShadow: `0 0 0 3px ${lineColor}`,
              }}
              className="absolute -left-7 top-1.5 h-3 w-3 rounded-full"
            />

            <div
              style={{ background: cardBg, border: `1px solid ${lineColor}` }}
              className="rounded-xl p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: textColor }}>
                    {exp.role}
                  </p>
                  {exp.company && (
                    <p style={{ color: companyColor, fontSize: '0.8rem' }} className="mt-0.5">
                      {exp.company}
                    </p>
                  )}
                </div>
                {exp.period && (
                  <span
                    style={{
                      color: mutedColor,
                      fontSize: '0.72rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${lineColor}`,
                    }}
                    className="shrink-0 rounded-full px-2.5 py-0.5"
                  >
                    {exp.period}
                  </span>
                )}
              </div>
              {exp.summary && (
                <p style={{ color: mutedColor, fontSize: '0.83rem', lineHeight: 1.65 }} className="mt-2">
                  {exp.summary}
                </p>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
