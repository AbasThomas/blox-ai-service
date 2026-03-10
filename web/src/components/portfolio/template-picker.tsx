'use client';

import { useState } from 'react';
import type { KeyboardEventHandler } from 'react';
import { PORTFOLIO_TEMPLATE_OPTIONS, type PortfolioTemplateOption } from '@/lib/portfolio-templates';
import { PortfolioTemplateRenderer } from './templates/PortfolioTemplateRenderer';
import { MOCK_PORTFOLIO_PROFILE } from './mock-profile';
import { Sparkles } from '@/components/ui/icons';

/* ─── Template Preview ────────────────────────────────────────────────────── */

type DeviceMode = 'desktop' | 'mobile';

const DEVICE_CONFIG: Record<DeviceMode, { width: number; height: number; scale: number }> = {
  desktop: { width: 1280, height: 800, scale: 0.25 },
  mobile: { width: 390, height: 844, scale: 0.42 },
};

function TemplatePreview({
  template,
  deviceMode,
}: {
  template: PortfolioTemplateOption;
  deviceMode: DeviceMode;
}) {
  const { width, height, scale } = DEVICE_CONFIG[deviceMode];

  return (
    <div
      className="relative h-full w-full overflow-hidden select-none pointer-events-none"
      style={{ backgroundColor: template.bg, clipPath: 'inset(0)', isolation: 'isolate' }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <PortfolioTemplateRenderer
          profile={{ ...MOCK_PORTFOLIO_PROFILE, templateId: template.id }}
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
  onEditCode,
  deviceMode,
}: {
  template: PortfolioTemplateOption;
  selected: boolean;
  onSelect: (id: string) => void;
  onEditCode?: (id: string) => void;
  deviceMode: DeviceMode;
}) {
  const [hovered, setHovered] = useState(false);
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
      aria-label={`Select ${template.name} template`}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-indigo-500/60 ring-2 ring-indigo-500/25 ring-offset-1 ring-offset-transparent'
          : 'border-white/10 hover:border-white/25'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden bg-[#0C0F13]" style={{ aspectRatio: '16/10' }}>
        <TemplatePreview template={template} deviceMode={deviceMode} />

        {/* Hover overlay with template info */}
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
            hovered && !selected
              ? 'bg-black/50 opacity-100 backdrop-blur-sm'
              : 'opacity-0 bg-transparent'
          }`}
        >
          <span
            className="rounded-full px-4 py-1.5 text-xs font-bold text-white"
            style={{ background: template.accent + 'cc' }}
          >
            Use this template
          </span>
          <div className="flex flex-wrap justify-center gap-1 px-4">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] text-white/80 capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Selected check */}
        {selected && (
          <div className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-lg">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
              <path
                fill={template.accent || '#6366f1'}
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>
        )}

        {/* Accent color strip at bottom */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-full"
          style={{ background: template.accent }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 border-t border-white/5 bg-[#0C0F13] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">{template.name}</span>
          <div className="flex items-center gap-1.5">
            {onEditCode && selected && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEditCode(template.id); }}
                title="Edit template code"
                className="flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
              >
                <Sparkles size={9} />
                Edit Code
              </button>
            )}
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: template.accent }}
              aria-hidden
            />
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
  /** Called when user clicks "Edit Code" on the selected template */
  onEditCode?: (templateId: string) => void;
}

export function TemplatePicker({
  value,
  onChange,
  columns = 3,
  onEditCode,
}: TemplatePickerProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Preview as:</span>
        <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {(['desktop', 'mobile'] as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDeviceMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                deviceMode === mode
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-4 ${
          columns === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
        }`}
      >
        {PORTFOLIO_TEMPLATE_OPTIONS.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={value === template.id}
            onSelect={onChange}
            onEditCode={onEditCode}
            deviceMode={deviceMode}
          />
        ))}
      </div>
    </div>
  );
}
