'use client';

import { PORTFOLIO_TEMPLATE_OPTIONS, type PortfolioTemplateOption } from '@/lib/portfolio-templates';

/* ─── Layout SVG mockups ──────────────────────────────────────────────────── */

function MockupSplitHero({ t }: { t: PortfolioTemplateOption }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="130" fill={t.bg} />
      {/* nav */}
      <rect width="200" height="14" fill={t.surface} />
      <rect x="8" y="4" width="22" height="6" rx="2" fill={t.accent} />
      <rect x="130" y="4" width="20" height="6" rx="2" fill={t.accent} fillOpacity="0.2" />
      <rect x="155" y="4" width="18" height="6" rx="3" fill={t.accent} fillOpacity="0.9" />
      {/* hero text (left) */}
      <rect x="10" y="24" width="78" height="9" rx="2.5" fill={t.text} fillOpacity="0.9" />
      <rect x="10" y="37" width="55" height="6" rx="2" fill={t.accent} fillOpacity="0.8" />
      <rect x="10" y="47" width="68" height="3.5" rx="1.5" fill={t.text} fillOpacity="0.2" />
      <rect x="10" y="54" width="52" height="3.5" rx="1.5" fill={t.text} fillOpacity="0.15" />
      <rect x="10" y="65" width="38" height="10" rx="5" fill={t.accent} />
      <rect x="52" y="65" width="30" height="10" rx="5" fill={t.surface} stroke={t.accent} strokeWidth="0.8" strokeOpacity="0.4" />
      {/* avatar (right) */}
      <circle cx="155" cy="52" r="28" fill={t.surface} stroke={t.accent} strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="155" cy="44" r="11" fill={t.accent} fillOpacity="0.25" />
      <path d="M131 72 Q155 62 179 72" fill={t.accent} fillOpacity="0.12" />
      {/* cards */}
      <rect x="8" y="95" width="54" height="28" rx="4" fill={t.surface} />
      <rect x="10" y="99" width="24" height="4" rx="1.5" fill={t.accent} fillOpacity="0.6" />
      <rect x="10" y="106" width="40" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="10" y="111" width="32" height="2.5" rx="1" fill={t.text} fillOpacity="0.15" />
      <rect x="70" y="95" width="54" height="28" rx="4" fill={t.surface} />
      <rect x="72" y="99" width="24" height="4" rx="1.5" fill={t.accent} fillOpacity="0.6" />
      <rect x="72" y="106" width="40" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="72" y="111" width="32" height="2.5" rx="1" fill={t.text} fillOpacity="0.15" />
      <rect x="132" y="95" width="60" height="28" rx="4" fill={t.surface} />
      <rect x="134" y="99" width="24" height="4" rx="1.5" fill={t.accent} fillOpacity="0.6" />
      <rect x="134" y="106" width="44" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="134" y="111" width="36" height="2.5" rx="1" fill={t.text} fillOpacity="0.15" />
    </svg>
  );
}

function MockupCenteredCta({ t }: { t: PortfolioTemplateOption }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="130" fill={t.bg} />
      {/* nav */}
      <rect width="200" height="14" fill={t.surface} />
      <rect x="8" y="4" width="28" height="6" rx="2" fill={t.accent} />
      <rect x="140" y="4" width="50" height="6" rx="2" fill={t.text} fillOpacity="0.15" />
      {/* centered hero */}
      <rect x="42" y="22" width="116" height="8" rx="2.5" fill={t.text} fillOpacity="0.9" />
      <rect x="60" y="34" width="80" height="6" rx="2" fill={t.accent} fillOpacity="0.85" />
      <rect x="52" y="44" width="96" height="3" rx="1.5" fill={t.text} fillOpacity="0.2" />
      <rect x="62" y="50" width="76" height="3" rx="1.5" fill={t.text} fillOpacity="0.15" />
      {/* big CTA */}
      <rect x="66" y="60" width="68" height="14" rx="7" fill={t.accent} />
      <rect x="78" y="64" width="44" height="6" rx="2" fill={t.bg} fillOpacity="0.6" />
      {/* 2x2 service grid */}
      <rect x="8" y="84" width="88" height="20" rx="3" fill={t.surface} stroke={t.accent} strokeWidth="0.5" strokeOpacity="0.4" />
      <rect x="12" y="88" width="28" height="4" rx="1.5" fill={t.accent} fillOpacity="0.7" />
      <rect x="12" y="95" width="50" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="104" y="84" width="88" height="20" rx="3" fill={t.surface} stroke={t.accent} strokeWidth="0.5" strokeOpacity="0.4" />
      <rect x="108" y="88" width="28" height="4" rx="1.5" fill={t.accent} fillOpacity="0.7" />
      <rect x="108" y="95" width="50" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="8" y="108" width="88" height="18" rx="3" fill={t.surface} stroke={t.accent} strokeWidth="0.5" strokeOpacity="0.4" />
      <rect x="12" y="112" width="28" height="4" rx="1.5" fill={t.accent} fillOpacity="0.5" />
      <rect x="104" y="108" width="88" height="18" rx="3" fill={t.surface} stroke={t.accent} strokeWidth="0.5" strokeOpacity="0.4" />
      <rect x="108" y="112" width="28" height="4" rx="1.5" fill={t.accent} fillOpacity="0.5" />
    </svg>
  );
}

function MockupTimeline({ t }: { t: PortfolioTemplateOption }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="130" fill={t.bg} />
      {/* terminal nav */}
      <rect width="200" height="14" fill={t.surface} />
      <circle cx="10" cy="7" r="3" fill="#F87171" fillOpacity="0.7" />
      <circle cx="19" cy="7" r="3" fill="#FCD34D" fillOpacity="0.7" />
      <circle cx="28" cy="7" r="3" fill={t.accent} fillOpacity="0.7" />
      <rect x="38" y="4" width="60" height="6" rx="2" fill={t.accent} fillOpacity="0.15" />
      {/* $ prompt hero */}
      <rect x="10" y="20" width="8" height="7" rx="1.5" fill={t.accent} fillOpacity="0.8" />
      <rect x="22" y="20" width="80" height="7" rx="2" fill={t.text} fillOpacity="0.85" />
      <rect x="10" y="31" width="100" height="4" rx="1.5" fill={t.accent} fillOpacity="0.4" />
      <rect x="10" y="39" width="75" height="3" rx="1.5" fill={t.text} fillOpacity="0.2" />
      {/* timeline entries */}
      <rect x="18" y="52" width="1.5" height="60" rx="0.75" fill={t.accent} fillOpacity="0.3" />
      {/* entry 1 */}
      <circle cx="18" cy="55" r="4" fill={t.bg} stroke={t.accent} strokeWidth="1.5" />
      <rect x="28" y="51" width="60" height="5" rx="1.5" fill={t.text} fillOpacity="0.7" />
      <rect x="28" y="59" width="44" height="3" rx="1" fill={t.accent} fillOpacity="0.5" />
      {/* entry 2 */}
      <circle cx="18" cy="74" r="4" fill={t.bg} stroke={t.accent} strokeWidth="1.5" />
      <rect x="28" y="70" width="56" height="5" rx="1.5" fill={t.text} fillOpacity="0.7" />
      <rect x="28" y="78" width="38" height="3" rx="1" fill={t.accent} fillOpacity="0.5" />
      {/* entry 3 */}
      <circle cx="18" cy="93" r="4" fill={t.bg} stroke={t.accent} strokeWidth="1.5" />
      <rect x="28" y="89" width="48" height="5" rx="1.5" fill={t.text} fillOpacity="0.7" />
      <rect x="28" y="97" width="32" height="3" rx="1" fill={t.accent} fillOpacity="0.5" />
      {/* code-style project cards */}
      <rect x="112" y="50" width="80" height="36" rx="4" fill={t.surface} />
      <rect x="116" y="55" width="12" height="4" rx="1.5" fill={t.accent} fillOpacity="0.8" />
      <rect x="132" y="56" width="50" height="2.5" rx="1" fill={t.text} fillOpacity="0.3" />
      <rect x="116" y="63" width="65" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="116" y="69" width="50" height="2.5" rx="1" fill={t.text} fillOpacity="0.15" />
      <rect x="116" y="76" width="30" height="6" rx="3" fill={t.accent} fillOpacity="0.2" />
      <rect x="150" y="76" width="30" height="6" rx="3" fill={t.accent} fillOpacity="0.15" />
      <rect x="112" y="92" width="80" height="28" rx="4" fill={t.surface} />
      <rect x="116" y="97" width="12" height="4" rx="1.5" fill={t.accent} fillOpacity="0.8" />
      <rect x="132" y="98" width="44" height="2.5" rx="1" fill={t.text} fillOpacity="0.3" />
      <rect x="116" y="105" width="65" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
      <rect x="116" y="112" width="30" height="5" rx="2.5" fill={t.accent} fillOpacity="0.2" />
    </svg>
  );
}

function MockupMinimal({ t }: { t: PortfolioTemplateOption }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="130" fill={t.bg} />
      {/* light nav */}
      <rect width="200" height="12" fill={t.surface} stroke="#E5E7EB" strokeWidth="0.5" />
      <rect x="8" y="3.5" width="30" height="5" rx="1.5" fill={t.accent} fillOpacity="0.7" />
      <rect x="130" y="3.5" width="16" height="5" rx="1.5" fill={t.text} fillOpacity="0.3" />
      <rect x="150" y="3.5" width="16" height="5" rx="1.5" fill={t.text} fillOpacity="0.3" />
      <rect x="170" y="3.5" width="16" height="5" rx="1.5" fill={t.accent} fillOpacity="0.5" />
      {/* serif-style name */}
      <rect x="20" y="22" width="100" height="10" rx="2" fill={t.text} fillOpacity="0.9" />
      <rect x="20" y="36" width="70" height="5" rx="1.5" fill={t.accent} fillOpacity="0.6" />
      {/* thin divider */}
      <line x1="20" y1="46" x2="180" y2="46" stroke={t.text} strokeOpacity="0.1" strokeWidth="1" />
      {/* about text lines */}
      <rect x="20" y="52" width="160" height="3" rx="1.5" fill={t.text} fillOpacity="0.18" />
      <rect x="20" y="58" width="144" height="3" rx="1.5" fill={t.text} fillOpacity="0.15" />
      <rect x="20" y="64" width="152" height="3" rx="1.5" fill={t.text} fillOpacity="0.13" />
      <rect x="20" y="70" width="120" height="3" rx="1.5" fill={t.text} fillOpacity="0.1" />
      {/* skills chips */}
      <rect x="20" y="80" width="28" height="8" rx="4" fill={t.accent} fillOpacity="0.12" stroke={t.accent} strokeWidth="0.6" strokeOpacity="0.4" />
      <rect x="52" y="80" width="36" height="8" rx="4" fill={t.accent} fillOpacity="0.12" stroke={t.accent} strokeWidth="0.6" strokeOpacity="0.4" />
      <rect x="92" y="80" width="28" height="8" rx="4" fill={t.accent} fillOpacity="0.12" stroke={t.accent} strokeWidth="0.6" strokeOpacity="0.4" />
      <rect x="124" y="80" width="32" height="8" rx="4" fill={t.accent} fillOpacity="0.12" stroke={t.accent} strokeWidth="0.6" strokeOpacity="0.4" />
      {/* project list links */}
      <line x1="20" y1="96" x2="180" y2="96" stroke={t.text} strokeOpacity="0.08" strokeWidth="1" />
      <rect x="20" y="102" width="60" height="4" rx="1.5" fill={t.text} fillOpacity="0.55" />
      <rect x="20" y="110" width="46" height="3.5" rx="1.5" fill={t.text} fillOpacity="0.25" />
      <rect x="20" y="118" width="52" height="3.5" rx="1.5" fill={t.accent} fillOpacity="0.5" />
      <rect x="130" y="102" width="50" height="4" rx="1.5" fill={t.text} fillOpacity="0.55" />
      <rect x="130" y="110" width="38" height="3.5" rx="1.5" fill={t.text} fillOpacity="0.25" />
      <rect x="130" y="118" width="40" height="3.5" rx="1.5" fill={t.accent} fillOpacity="0.5" />
    </svg>
  );
}

function MockupGridShowcase({ t }: { t: PortfolioTemplateOption }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="130" fill={t.bg} />
      {/* gradient hero band */}
      <defs>
        <linearGradient id={`gh-${t.id}`} x1="0" y1="0" x2="200" y2="52">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={t.bg} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="200" height="52" fill={`url(#gh-${t.id})`} />
      {/* nav */}
      <rect width="200" height="13" fill={t.surface} fillOpacity="0.7" />
      <rect x="8" y="3.5" width="22" height="6" rx="2" fill={t.accent} />
      <rect x="160" y="3" width="32" height="7" rx="3.5" fill={t.accent} fillOpacity="0.9" />
      {/* hero text */}
      <rect x="8" y="18" width="100" height="9" rx="2.5" fill={t.text} fillOpacity="0.9" />
      <rect x="8" y="31" width="70" height="5" rx="2" fill={t.accent} fillOpacity="0.7" />
      <rect x="8" y="40" width="56" height="7" rx="3.5" fill={t.accent} />
      {/* masonry grid */}
      {/* col 1 */}
      <rect x="8" y="60" width="56" height="40" rx="4" fill={t.surface} />
      <rect x="8" y="60" width="56" height="18" rx="4" fill={t.accent} fillOpacity="0.2" />
      <rect x="12" y="81" width="36" height="4" rx="1.5" fill={t.text} fillOpacity="0.6" />
      <rect x="12" y="88" width="28" height="3" rx="1" fill={t.text} fillOpacity="0.25" />
      {/* col 2 */}
      <rect x="72" y="60" width="56" height="26" rx="4" fill={t.surface} />
      <rect x="72" y="60" width="56" height="12" rx="4" fill={t.accent} fillOpacity="0.25" />
      <rect x="76" y="74" width="36" height="4" rx="1.5" fill={t.text} fillOpacity="0.6" />
      <rect x="72" y="92" width="56" height="22" rx="4" fill={t.surface} />
      <rect x="76" y="97" width="36" height="4" rx="1.5" fill={t.accent} fillOpacity="0.6" />
      <rect x="76" y="104" width="28" height="3" rx="1" fill={t.text} fillOpacity="0.25" />
      {/* col 3 */}
      <rect x="136" y="60" width="56" height="32" rx="4" fill={t.surface} />
      <rect x="136" y="60" width="56" height="16" rx="4" fill={t.accent} fillOpacity="0.2" />
      <rect x="140" y="79" width="36" height="4" rx="1.5" fill={t.text} fillOpacity="0.6" />
      <rect x="140" y="86" width="28" height="3" rx="1" fill={t.text} fillOpacity="0.25" />
      <rect x="136" y="98" width="56" height="16" rx="4" fill={t.surface} />
      <rect x="140" y="103" width="36" height="4" rx="1.5" fill={t.accent} fillOpacity="0.5" />
      <rect x="140" y="110" width="24" height="2.5" rx="1" fill={t.text} fillOpacity="0.2" />
    </svg>
  );
}

function TemplateMockup({ template }: { template: PortfolioTemplateOption }) {
  switch (template.layout) {
    case 'split-hero': return <MockupSplitHero t={template} />;
    case 'centered-cta': return <MockupCenteredCta t={template} />;
    case 'timeline': return <MockupTimeline t={template} />;
    case 'minimal': return <MockupMinimal t={template} />;
    case 'grid-showcase': return <MockupGridShowcase t={template} />;
  }
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
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/30'
          : 'border-white/8 hover:border-white/20'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[200/130] w-full overflow-hidden" style={{ background: template.bg }}>
        <TemplateMockup template={template} />
        {/* selected checkmark */}
        {selected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
            <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 fill-none stroke-white stroke-2 stroke-linecap-round stroke-linejoin-round">
              <path d="M2 6l3 3 5-5" />
            </svg>
          </div>
        )}
        {/* accent stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: template.accent }} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 bg-white/[0.02] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">{template.name}</span>
          <div className="flex items-center gap-1">
            {template.tags.slice(0, 1).map((tag) => (
              <span key={tag} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: template.accent, background: `${template.accent}18` }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[11px] leading-snug text-slate-500">{template.description}</p>
      </div>
    </button>
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
    <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
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
