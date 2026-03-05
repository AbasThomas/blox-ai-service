'use client';

import type { KeyboardEventHandler } from 'react';
import { PORTFOLIO_TEMPLATE_OPTIONS, type PortfolioTemplateOption } from '@/lib/portfolio-templates';
import { PortfolioTemplateRenderer } from './templates/PortfolioTemplateRenderer';
import { MOCK_PORTFOLIO_PROFILE } from './mock-profile';

/* ─── Template Preview ────────────────────────────────────────────────────── */

function TemplatePreview({ template }: { template: PortfolioTemplateOption }) {
  // We use a scaled-down container to show the actual template
  // Assuming a base desktop width of 1280px
  const SCALE = 0.25; 
  const BASE_WIDTH = 1280;
  const BASE_HEIGHT = 800; // Arbitrary height for the preview window

  return (
    <div 
      className="relative w-full h-full bg-slate-900 overflow-hidden select-none pointer-events-none"
      style={{ backgroundColor: template.bg }}
    >
      <div 
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        <PortfolioTemplateRenderer 
          profile={{
            ...MOCK_PORTFOLIO_PROFILE,
            templateId: template.id
          }}
          subdomain="preview"
          templateId={template.id}
        />
      </div>
    </div>
  );
}

/* ─── Template Card ───────────────────────────────────────────────────────── */

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: PortfolioTemplateOption;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const handleActivate = () => onSelect(template.id);
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        selected
          ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0C0F13]">
        <TemplatePreview template={template} />
        
        {/* Interaction Overlay */}
        <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/10 transition-colors" />

        {/* Selected Checkmark */}
        {selected && (
          <div className="absolute right-2 top-2 z-20 text-indigo-500 drop-shadow-md bg-white rounded-full">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 border-t border-white/5 bg-[#0C0F13] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">{template.name}</span>
          <div className="flex items-center gap-1">
             {/* Only show first tag */}
             {template.tags.slice(0, 1).map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="truncate text-[10px] text-slate-500">{template.description}</p>
      </div>
    </div>
  );
}

/* ─── Template Picker ─────────────────────────────────────────────────────── */

interface TemplatePickerProps {
  value: string;
  onChange: (id: string) => void;
  columns?: 2 | 3;
}

export function TemplatePicker({ value, onChange, columns = 3 }: TemplatePickerProps) {
  return (
    <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
      {PORTFOLIO_TEMPLATE_OPTIONS.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          selected={value === template.id}
          onSelect={onChange}
        />
      ))}
    </div>
  );
}
