'use client';

import { useState } from 'react';
import { TEMPLATE_META } from './meta';
import { RESUME_TEMPLATES } from './mapping';
import { MOCK_PREVIEW_DATA } from './mock-data';
import { CheckCircle } from '@/components/ui/icons';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const CATEGORY_ACCENTS: Record<string, string> = {
  tech: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
  executive: 'border-slate-500/40 text-slate-400 bg-slate-500/10',
  design: 'border-violet-500/40 text-violet-400 bg-violet-500/10',
  academic: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  freelance: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
  marketing: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
  general: 'border-slate-400/30 text-slate-400 bg-slate-400/10',
  entry: 'border-blue-400/30 text-blue-400 bg-blue-400/10',
};

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {TEMPLATE_META.map((t) => {
        const isSelected = selectedId === t.id;
        const isHovered = hoveredId === t.id;
        const Template = RESUME_TEMPLATES[t.id];
        const categoryClass = CATEGORY_ACCENTS[t.category] ?? CATEGORY_ACCENTS.general;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            onMouseEnter={() => setHoveredId(t.id)}
            onMouseLeave={() => setHoveredId(null)}
            aria-pressed={isSelected}
            aria-label={`Select ${t.name} template`}
            className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 ${
              isSelected
                ? 'border-indigo-500/60 ring-2 ring-indigo-500/25 ring-offset-1 ring-offset-transparent'
                : isHovered
                  ? 'border-white/20 bg-white/5'
                  : 'border-white/8 hover:border-white/15'
            }`}
          >
            {/* Live Preview Container — A4 aspect ratio (210:297) */}
            <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: '210/297' }}>
              {/* Scaled A4 template page (scale = container_width / 210mm) */}
              {/* At ~190px wide container, scale ≈ 190/794 ≈ 0.239 */}
              <div className="absolute left-0 top-0 h-[297mm] w-[210mm] origin-top-left scale-[0.24] select-none">
                {Template ? (
                  <Template data={MOCK_PREVIEW_DATA} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-50 text-xs text-slate-400">
                    Preview Unavailable
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div
                className={`absolute inset-0 z-10 transition-colors duration-200 ${
                  isHovered && !isSelected ? 'bg-black/5' : 'bg-transparent'
                }`}
              />
            </div>

            {/* Template Meta */}
            <div className="flex flex-col gap-1.5 border-t border-white/5 bg-[#0C0F13] px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-slate-200">{t.name}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-px text-[9px] font-semibold capitalize ${categoryClass}`}
                >
                  {t.category}
                </span>
                {t.description && (
                  <span className="hidden truncate text-[10px] text-slate-600 sm:block">{t.description}</span>
                )}
              </div>
            </div>

            {/* Selected check */}
            {isSelected && (
              <div className="absolute right-1.5 top-1.5 z-20 drop-shadow-md">
                <CheckCircle className="h-5 w-5 fill-indigo-500 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
