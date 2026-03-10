'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { editor as MonacoEditor } from 'monaco-editor';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateRenderer } from '../templates/PortfolioTemplateRenderer';
import { getTemplateById, type PortfolioTemplateOption } from '@/lib/portfolio-templates';
import { CheckCircle, RotateCcw, Sparkles, X } from '@/components/ui/icons';

const MonacoEditorComponent = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-[#1e1e1e]">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1ECEFA] border-t-transparent" />
    </div>
  ),
});

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CodeCustomizations { css: string; config: string; }

export interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  profile: PublicProfilePayload;
  initialCss?: string;
  initialConfig?: string;
  onSave: (c: CodeCustomizations) => Promise<void>;
}

type AppMode   = 'code' | 'design';
type EditorTab = 'css' | 'config' | 'source';

// ─── Design config schema ─────────────────────────────────────────────────────

const DEFAULT_SECTIONS = ['hero', 'about', 'experience', 'projects', 'skills', 'certifications', 'contact'];

interface DesignConfig {
  colors: {
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingSize: number;     // rem
    headingWeight: number;   // 100–900
    headingTracking: number; // hundredths of em (-3 = -0.03em)
    bodySize: number;        // rem * 10 (14 = 1.4rem)
    lineHeight: number;      // 10x (16 = 1.6)
  };
  spacing: {
    sectionPaddingY: number; // px
    contentMaxWidth: number; // px
    cardGap: number;         // px
  };
  shape: {
    cardRadius: number;   // px
    buttonRadius: number; // px
    imageRadius: number;  // px
  };
  effects: {
    cardShadow: 'none' | 'sm' | 'md' | 'lg' | 'glow';
    cardBorderWidth: number; // px
    cardBlur: number;        // px backdrop-filter
    cardOpacity: number;     // 10–100
  };
  layout: {
    sectionOrder: string[];
    heroAlign: 'left' | 'center' | 'right';
    contentAlign: 'left' | 'center';
  };
}

function defaultDesignConfig(t: PortfolioTemplateOption): DesignConfig {
  return {
    colors: { accent: t.accent, background: t.bg, surface: t.surface ?? '#1a1a2e', text: t.text ?? '#e2e8f0', textMuted: '#94a3b8', border: t.accent + '33' },
    typography: { headingFont: 'Inter', bodyFont: 'Inter', headingSize: 35, headingWeight: 700, headingTracking: -2, bodySize: 10, lineHeight: 16 },
    spacing: { sectionPaddingY: 80, contentMaxWidth: 1200, cardGap: 24 },
    shape: { cardRadius: 12, buttonRadius: 8, imageRadius: 8 },
    effects: { cardShadow: 'md', cardBorderWidth: 1, cardBlur: 0, cardOpacity: 100 },
    layout: { sectionOrder: [...DEFAULT_SECTIONS], heroAlign: 'left', contentAlign: 'left' },
  };
}

function parseDesignConfig(json: string, t: PortfolioTemplateOption): DesignConfig {
  const def = defaultDesignConfig(t);
  try {
    const c = JSON.parse(json);
    return {
      colors: {
        accent:     c.colors?.accent      || def.colors.accent,
        background: c.colors?.background  || def.colors.background,
        surface:    c.colors?.surface     || def.colors.surface,
        text:       c.colors?.text        || def.colors.text,
        textMuted:  c.colors?.textMuted   || def.colors.textMuted,
        border:     c.colors?.border      || def.colors.border,
      },
      typography: {
        headingFont:     c.typography?.headingFont     || def.typography.headingFont,
        bodyFont:        c.typography?.bodyFont        || def.typography.bodyFont,
        headingSize:     c.typography?.headingSize     ?? def.typography.headingSize,
        headingWeight:   c.typography?.headingWeight   ?? def.typography.headingWeight,
        headingTracking: c.typography?.headingTracking ?? def.typography.headingTracking,
        bodySize:        c.typography?.bodySize        ?? def.typography.bodySize,
        lineHeight:      c.typography?.lineHeight      ?? def.typography.lineHeight,
      },
      spacing: {
        sectionPaddingY: c.spacing?.sectionPaddingY ?? def.spacing.sectionPaddingY,
        contentMaxWidth: c.spacing?.contentMaxWidth ?? def.spacing.contentMaxWidth,
        cardGap:         c.spacing?.cardGap         ?? def.spacing.cardGap,
      },
      shape: {
        cardRadius:   c.shape?.cardRadius   ?? def.shape.cardRadius,
        buttonRadius: c.shape?.buttonRadius ?? def.shape.buttonRadius,
        imageRadius:  c.shape?.imageRadius  ?? def.shape.imageRadius,
      },
      effects: {
        cardShadow:      c.effects?.cardShadow      ?? def.effects.cardShadow,
        cardBorderWidth: c.effects?.cardBorderWidth ?? def.effects.cardBorderWidth,
        cardBlur:        c.effects?.cardBlur        ?? def.effects.cardBlur,
        cardOpacity:     c.effects?.cardOpacity     ?? def.effects.cardOpacity,
      },
      layout: {
        sectionOrder: Array.isArray(c.layout?.sectionOrder) ? c.layout.sectionOrder : def.layout.sectionOrder,
        heroAlign:    c.layout?.heroAlign    || def.layout.heroAlign,
        contentAlign: c.layout?.contentAlign || def.layout.contentAlign,
      },
    };
  } catch { return def; }
}

function serializeDesignConfig(d: DesignConfig): string {
  return JSON.stringify(d, null, 2);
}

// ─── Config → CSS ─────────────────────────────────────────────────────────────

const SHADOW_MAP = {
  none: 'none',
  sm:   '0 1px 4px rgba(0,0,0,0.2)',
  md:   '0 4px 20px rgba(0,0,0,0.35)',
  lg:   '0 8px 40px rgba(0,0,0,0.5)',
  glow: '0 0 32px var(--color-accent, #1ECEFA44)',
};

function configToCss(json: string): string {
  try {
    const d = JSON.parse(json) as DesignConfig;
    const c = d.colors ?? {};
    const ty = d.typography ?? {};
    const sp = d.spacing ?? {};
    const sh = d.shape ?? {};
    const ef = d.effects ?? {};
    const la = d.layout ?? {};
    const lines: string[] = [];

    // ── CSS vars ──
    lines.push(`:root {
  --color-accent: ${c.accent ?? ''};
  --color-bg: ${c.background ?? ''};
  --color-surface: ${c.surface ?? ''};
  --color-text: ${c.text ?? ''};
  --color-muted: ${c.textMuted ?? ''};
  --color-border: ${c.border ?? ''};
}`);

    // ── Colors ──
    if (c.accent)     lines.push(`a, a:hover, [data-accent] { color: ${c.accent} !important; }`);
    if (c.background) lines.push(`body, [data-template-root] { background-color: ${c.background} !important; }`);
    if (c.surface)    lines.push(`[data-card], .card, [class*="rounded-xl"], [class*="rounded-2xl"] { background-color: ${c.surface} !important; }`);
    if (c.text)       lines.push(`body, p, li, span { color: ${c.text} !important; }`);
    if (c.textMuted)  lines.push(`small, [class*="text-gray"], [class*="text-slate"], [class*="text-muted"] { color: ${c.textMuted} !important; }`);
    if (c.border)     lines.push(`[data-card], [class*="border"] { border-color: ${c.border} !important; }`);

    // ── Typography ──
    if (ty.headingFont) lines.push(`h1, h2, h3, h4 { font-family: '${ty.headingFont}', system-ui, sans-serif !important; }`);
    if (ty.bodyFont)    lines.push(`body, p, li, span, input, button { font-family: '${ty.bodyFont}', system-ui, sans-serif !important; }`);
    if (ty.headingSize) {
      const hs = ty.headingSize / 10;
      lines.push(`h1 { font-size: ${hs}rem !important; }
h2 { font-size: ${(hs * 0.72).toFixed(2)}rem !important; }
h3 { font-size: ${(hs * 0.58).toFixed(2)}rem !important; }`);
    }
    if (ty.headingWeight)   lines.push(`h1, h2, h3, h4 { font-weight: ${ty.headingWeight} !important; }`);
    if (ty.headingTracking !== undefined) lines.push(`h1, h2, h3 { letter-spacing: ${(ty.headingTracking / 100).toFixed(3)}em !important; }`);
    if (ty.bodySize)   lines.push(`body, p, li { font-size: ${ty.bodySize / 10}rem !important; }`);
    if (ty.lineHeight) lines.push(`body, p, li { line-height: ${ty.lineHeight / 10} !important; }`);

    // ── Spacing ──
    if (sp.sectionPaddingY) lines.push(`section, [data-section] { padding-top: ${sp.sectionPaddingY}px !important; padding-bottom: ${sp.sectionPaddingY}px !important; }`);
    if (sp.contentMaxWidth) lines.push(`.container, [data-container], [class*="max-w-"] { max-width: ${sp.contentMaxWidth}px !important; }`);
    if (sp.cardGap)         lines.push(`.grid, [data-grid], [class*="gap-"] { gap: ${sp.cardGap}px !important; }`);

    // ── Shape ──
    if (sh.cardRadius !== undefined)   lines.push(`[data-card], [class*="rounded-xl"], [class*="rounded-2xl"] { border-radius: ${sh.cardRadius}px !important; }`);
    if (sh.buttonRadius !== undefined) lines.push(`button, [role="button"], a[class*="btn"] { border-radius: ${sh.buttonRadius}px !important; }`);
    if (sh.imageRadius !== undefined)  lines.push(`img { border-radius: ${sh.imageRadius}px !important; }`);

    // ── Effects ──
    const shadow = SHADOW_MAP[ef.cardShadow as keyof typeof SHADOW_MAP];
    if (shadow) lines.push(`[data-card] { box-shadow: ${shadow} !important; }`);
    if (ef.cardBorderWidth !== undefined) lines.push(`[data-card] { border-width: ${ef.cardBorderWidth}px !important; border-style: solid !important; }`);
    if (ef.cardBlur) lines.push(`[data-card] { backdrop-filter: blur(${ef.cardBlur}px) !important; -webkit-backdrop-filter: blur(${ef.cardBlur}px) !important; }`);
    if (ef.cardOpacity !== undefined && ef.cardOpacity < 100) lines.push(`[data-card] { opacity: ${(ef.cardOpacity / 100).toFixed(2)} !important; }`);

    // ── Layout ──
    if (la.heroAlign) lines.push(`[data-section="hero"], section:first-of-type { text-align: ${la.heroAlign} !important; }`);

    return lines.join('\n');
  } catch { return ''; }
}

// ─── Preview nav-hide CSS ─────────────────────────────────────────────────────

const PREVIEW_ID = 'ced-live-preview';
const HIDE_NAV_CSS = `
#${PREVIEW_ID} nav,
#${PREVIEW_ID} [class*="navbar"],
#${PREVIEW_ID} [class*="nav-bar"],
#${PREVIEW_ID} header > nav,
#${PREVIEW_ID} > div > nav,
#${PREVIEW_ID} .fixed.top-4,
#${PREVIEW_ID} [class*="fixed"][class*="top"] {
  display: none !important;
}`;

// ─── Micro icons ──────────────────────────────────────────────────────────────

const S = { w: 1.8, lc: 'round' as const, lj: 'round' as const };
function CodeIco({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={S.w} strokeLinecap={S.lc} strokeLinejoin={S.lj}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
function SaveIco({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={S.w} strokeLinecap={S.lc} strokeLinejoin={S.lj}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function RedoIco({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={S.w} strokeLinecap={S.lc} strokeLinejoin={S.lj}><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>; }
function WarnIco({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={S.w} strokeLinecap={S.lc} strokeLinejoin={S.lj}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function DragIco({ s = 12 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>; }
function PaletteIco({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={S.w} strokeLinecap={S.lc} strokeLinejoin={S.lj}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>; }

// ─── Shared input style (no whitish border — background only) ────────────────

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: 'none',
  outline: 'none',
  color: '#e2e8f0',
  borderRadius: 5,
};

// ─── Design Panel primitives ──────────────────────────────────────────────────

/** Collapsible section with Figma-style header */
function PanelSection({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.025]"
        style={{ cursor: 'pointer' }}
      >
        <svg
          width={7} height={7} viewBox="0 0 8 8" fill="currentColor"
          style={{ color: '#4b5563', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
        ><polygon points="2,1 7,4 2,7" /></svg>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</span>
      </button>
      {open && (
        <div style={{ padding: '2px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Prop row label */
function PropLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#6b7280', fontSize: 10, flexShrink: 0 }}>{children}</span>;
}

/** Figma-style scrubber — drag label left/right to change value */
function Scrub({
  label, value, onChange, min = 0, max = 9999, step = 1, unit = '', flex1 = false,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; flex1?: boolean }) {
  const startX   = useRef(0);
  const startVal = useRef(value);
  const active   = useRef(false);

  const onLabelDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    active.current   = true;
    startX.current   = e.clientX;
    startVal.current = value;
    document.body.style.cursor = 'ew-resize';
    const onMove = (ev: MouseEvent) => {
      if (!active.current) return;
      const raw = startVal.current + (ev.clientX - startX.current) * step;
      onChange(parseFloat(Math.min(max, Math.max(min, raw)).toFixed(2)));
    };
    const onUp = () => {
      active.current = false;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [value, min, max, step, onChange]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...(flex1 ? { flex: 1, minWidth: 0 } : {}) }}>
      <span
        onMouseDown={onLabelDown}
        title={`Drag to change ${label}`}
        style={{ color: '#6b7280', fontSize: 10, cursor: 'ew-resize', userSelect: 'none', flexShrink: 0, minWidth: 20 }}
      >{label}</span>
      <div style={{ position: 'relative', flex: 1, minWidth: 44 }}>
        <input
          type="number" value={value} step={step} min={min} max={max}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v))); }}
          style={{ ...INPUT_STYLE, width: '100%', padding: unit ? '4px 22px 4px 6px' : '4px 6px', fontSize: 11, textAlign: 'right', cursor: 'text' }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: 9, pointerEvents: 'none' }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

/** Two scrubbers side by side */
function ScrubRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>;
}

/** Color swatch + hex + opacity — no whitish border */
function ColorProp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hex = value.startsWith('#') ? value.slice(0, 7) : value;
  const opacity = value.length === 9 ? Math.round(parseInt(value.slice(7, 9), 16) / 255 * 100) : 100;
  const setOpacity = (op: number) => {
    const alpha = Math.round((op / 100) * 255).toString(16).padStart(2, '0');
    onChange(hex + (op < 100 ? alpha : ''));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Swatch — checkerboard for transparency, no border */}
      <label style={{ position: 'relative', width: 24, height: 24, borderRadius: 5, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='3' height='3' fill='%23444'/%3E%3Crect x='3' y='3' width='3' height='3' fill='%23444'/%3E%3Crect x='3' width='3' height='3' fill='%23333'/%3E%3Crect y='3' width='3' height='3' fill='%23333'/%3E%3C/svg%3E")` }}>
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value + (opacity < 100 ? Math.round(opacity / 100 * 255).toString(16).padStart(2, '0') : ''))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
        <div style={{ width: '100%', height: '100%', background: value }} />
      </label>
      {/* Label */}
      <PropLabel>{label}</PropLabel>
      {/* Hex */}
      <input
        type="text" value={hex} maxLength={7}
        onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
        style={{ ...INPUT_STYLE, flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'monospace', cursor: 'text' }}
      />
      {/* Opacity */}
      <div style={{ position: 'relative', width: 48, flexShrink: 0 }}>
        <input
          type="number" value={opacity} min={0} max={100} step={1}
          onChange={(e) => setOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          style={{ ...INPUT_STYLE, width: '100%', padding: '4px 18px 4px 6px', fontSize: 11, textAlign: 'right', cursor: 'text' }}
        />
        <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: 9, pointerEvents: 'none' }}>%</span>
      </div>
    </div>
  );
}

/** Icon/text toggle group — no whitish outer border */
function ToggleGroup<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; title?: string }[] }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.value} type="button" onClick={() => onChange(o.value)} title={o.title}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '5px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
            background: value === o.value ? 'rgba(30,206,250,0.18)' : 'transparent',
            color: value === o.value ? '#1ECEFA' : '#6b7280',
            transition: 'background 0.12s, color 0.12s',
            border: 'none',
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

/** Shadow preset chips — background-only differentiation */
function ShadowPicker({ value, onChange }: { value: DesignConfig['effects']['cardShadow']; onChange: (v: DesignConfig['effects']['cardShadow']) => void }) {
  const opts: DesignConfig['effects']['cardShadow'][] = ['none', 'sm', 'md', 'lg', 'glow'];
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {opts.map((o) => (
        <button
          key={o} type="button" onClick={() => onChange(o)}
          style={{
            padding: '4px 12px', borderRadius: 5, fontSize: 10, fontWeight: 500,
            cursor: 'pointer', border: 'none', transition: 'background 0.12s, color 0.12s',
            background: value === o ? 'rgba(30,206,250,0.18)' : 'rgba(255,255,255,0.06)',
            color: value === o ? '#1ECEFA' : '#9ca3af',
          }}
        >{o}</button>
      ))}
    </div>
  );
}

/** Font selector with datalist suggestions */
const FONTS = ['Inter', 'Roboto', 'Poppins', 'DM Sans', 'Raleway', 'Nunito', 'Lato', 'Open Sans', 'Montserrat', 'Georgia', 'Playfair Display', 'Merriweather', 'Lora', 'Cinzel', 'JetBrains Mono', 'Fira Code', 'Space Mono'];
function FontPicker({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <PropLabel>{label}</PropLabel>
      <input
        list={id} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...INPUT_STYLE, padding: '5px 10px', fontSize: 11, cursor: 'text' }}
      />
      <datalist id={id}>{FONTS.map((f) => <option key={f} value={f} />)}</datalist>
    </div>
  );
}

// ─── Section labels & drag-drop ───────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero', about: 'About', experience: 'Experience',
  projects: 'Projects', skills: 'Skills', certifications: 'Certifications', contact: 'Contact',
};
const SECTION_EMOJI: Record<string, string> = {
  hero: '🦸', about: '👤', experience: '💼',
  projects: '🚀', skills: '🔧', certifications: '📜', contact: '📬',
};

function SectionOrderList({ order, onChange }: { order: string[]; onChange: (o: string[]) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const onDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...order];
    const [item] = next.splice(dragIdx, 1);
    next.splice(i, 0, item);
    onChange(next);
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {order.map((section, i) => {
        const isDragging = dragIdx === i;
        const isAbove    = overIdx === i && dragIdx !== null && dragIdx > i;
        const isBelow    = overIdx === i && dragIdx !== null && dragIdx < i;
        return (
          <div
            key={section}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
            onDrop={(e) => onDrop(e, i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6,
              background: isDragging ? 'rgba(30,206,250,0.07)' : 'rgba(255,255,255,0.04)',
              boxShadow: isAbove ? 'inset 0 2px 0 #1ECEFA' : isBelow ? 'inset 0 -2px 0 #1ECEFA' : 'none',
              opacity: isDragging ? 0.4 : 1,
              cursor: 'grab',
              transition: 'background 0.1s',
              border: 'none',
            }}
          >
            <span style={{ color: '#374151', flexShrink: 0 }}><DragIco /></span>
            <span style={{ fontSize: 12 }}>{SECTION_EMOJI[section] ?? '·'}</span>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>{SECTION_LABELS[section] ?? section}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>#{i + 1}</span>
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...DEFAULT_SECTIONS])}
        style={{ marginTop: 4, padding: '6px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: 'none', transition: 'background 0.12s' }}
        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        onMouseOut={(e)  => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      >Reset order</button>
    </div>
  );
}

// ─── Main Design Panel ─────────────────────────────────────────────────────────

// ─── Reset button helper ──────────────────────────────────────────────────────

function ResetBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{ padding: '6px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', border: 'none',
        background: hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        color: hov ? '#d1d5db' : '#6b7280', transition: 'background 0.12s, color 0.12s', width: '100%' }}
    >{children}</button>
  );
}

// ─── Main Design Panel ────────────────────────────────────────────────────────

function DesignPanel({ config, template, onChange }: { config: DesignConfig; template: PortfolioTemplateOption; onChange: (c: DesignConfig) => void }) {
  const setColors  = (patch: Partial<DesignConfig['colors']>)     => onChange({ ...config, colors:     { ...config.colors,     ...patch } });
  const setTypo    = (patch: Partial<DesignConfig['typography']>) => onChange({ ...config, typography: { ...config.typography, ...patch } });
  const setSpacing = (patch: Partial<DesignConfig['spacing']>)    => onChange({ ...config, spacing:    { ...config.spacing,    ...patch } });
  const setShape   = (patch: Partial<DesignConfig['shape']>)      => onChange({ ...config, shape:      { ...config.shape,      ...patch } });
  const setEffects = (patch: Partial<DesignConfig['effects']>)    => onChange({ ...config, effects:    { ...config.effects,    ...patch } });
  const setLayout  = (patch: Partial<DesignConfig['layout']>)     => onChange({ ...config, layout:     { ...config.layout,     ...patch } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#111114', borderLeft: '1px solid rgba(255,255,255,0.04)', width: 300, flexShrink: 0 }}>
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', background: '#0d0d10', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <PaletteIco s={12} />
        <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>Design</span>
        <span style={{ marginLeft: 'auto', color: '#374151', fontSize: 9 }}>drag labels · scrub values</span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1e1e24 transparent' }}>

        {/* ── FILL ───────────────────────────────────────────────────── */}
        <PanelSection label="Fill">
          <ColorProp label="Accent"     value={config.colors.accent}     onChange={(v) => setColors({ accent: v })} />
          <ColorProp label="Background" value={config.colors.background} onChange={(v) => setColors({ background: v })} />
          <ColorProp label="Surface"    value={config.colors.surface}    onChange={(v) => setColors({ surface: v })} />
          <ColorProp label="Text"       value={config.colors.text}       onChange={(v) => setColors({ text: v })} />
          <ColorProp label="Muted"      value={config.colors.textMuted}  onChange={(v) => setColors({ textMuted: v })} />
          <ColorProp label="Border"     value={config.colors.border}     onChange={(v) => setColors({ border: v })} />
          <ResetBtn onClick={() => setColors(defaultDesignConfig(template).colors)}>Reset to template colors</ResetBtn>
        </PanelSection>

        {/* ── TYPOGRAPHY ─────────────────────────────────────────────── */}
        <PanelSection label="Typography">
          <FontPicker id="dp-h-font" label="Heading font" value={config.typography.headingFont} onChange={(v) => setTypo({ headingFont: v })} />
          <ScrubRow>
            <Scrub flex1 label="Size"  value={config.typography.headingSize}     onChange={(v) => setTypo({ headingSize: v })}     min={12} max={80}  step={1}   unit="×.1r" />
            <Scrub flex1 label="Wt"    value={config.typography.headingWeight}   onChange={(v) => setTypo({ headingWeight: v })}   min={100} max={900} step={100} />
          </ScrubRow>
          <Scrub label="Letter spacing" value={config.typography.headingTracking} onChange={(v) => setTypo({ headingTracking: v })} min={-10} max={20} step={1} unit="/100em" />

          {/* divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '4px 0' }} />

          <FontPicker id="dp-b-font" label="Body font" value={config.typography.bodyFont} onChange={(v) => setTypo({ bodyFont: v })} />
          <ScrubRow>
            <Scrub flex1 label="Size" value={config.typography.bodySize}   onChange={(v) => setTypo({ bodySize: v })}   min={8}  max={24} step={1} unit="×.1r" />
            <Scrub flex1 label="LH"   value={config.typography.lineHeight} onChange={(v) => setTypo({ lineHeight: v })} min={10} max={30} step={1} unit="×.1" />
          </ScrubRow>
        </PanelSection>

        {/* ── SPACING ────────────────────────────────────────────────── */}
        <PanelSection label="Spacing">
          <ScrubRow>
            <Scrub flex1 label="Sec Y" value={config.spacing.sectionPaddingY} onChange={(v) => setSpacing({ sectionPaddingY: v })} min={0} max={200} step={4}  unit="px" />
            <Scrub flex1 label="MaxW"  value={config.spacing.contentMaxWidth} onChange={(v) => setSpacing({ contentMaxWidth: v })} min={600} max={1800} step={40} unit="px" />
          </ScrubRow>
          <Scrub label="Card gap" value={config.spacing.cardGap} onChange={(v) => setSpacing({ cardGap: v })} min={0} max={64} step={4} unit="px" />
        </PanelSection>

        {/* ── SHAPE ──────────────────────────────────────────────────── */}
        <PanelSection label="Shape">
          <ScrubRow>
            <Scrub flex1 label="Card R" value={config.shape.cardRadius}   onChange={(v) => setShape({ cardRadius: v })}   min={0} max={40} step={1} unit="px" />
            <Scrub flex1 label="Btn R"  value={config.shape.buttonRadius} onChange={(v) => setShape({ buttonRadius: v })} min={0} max={40} step={1} unit="px" />
          </ScrubRow>
          <Scrub label="Image R" value={config.shape.imageRadius} onChange={(v) => setShape({ imageRadius: v })} min={0} max={40} step={1} unit="px" />
        </PanelSection>

        {/* ── EFFECTS ────────────────────────────────────────────────── */}
        <PanelSection label="Effects">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PropLabel>Shadow</PropLabel>
            <ShadowPicker value={config.effects.cardShadow} onChange={(v) => setEffects({ cardShadow: v })} />
          </div>
          <ScrubRow>
            <Scrub flex1 label="Border" value={config.effects.cardBorderWidth} onChange={(v) => setEffects({ cardBorderWidth: v })} min={0} max={4}  step={1} unit="px" />
            <Scrub flex1 label="Blur"   value={config.effects.cardBlur}        onChange={(v) => setEffects({ cardBlur: v })}        min={0} max={40} step={2} unit="px" />
          </ScrubRow>
          <Scrub label="Opacity" value={config.effects.cardOpacity} onChange={(v) => setEffects({ cardOpacity: v })} min={10} max={100} step={5} unit="%" />
        </PanelSection>

        {/* ── ALIGNMENT ──────────────────────────────────────────────── */}
        <PanelSection label="Alignment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PropLabel>Hero</PropLabel>
            <ToggleGroup<'left' | 'center' | 'right'>
              value={config.layout.heroAlign}
              onChange={(v) => setLayout({ heroAlign: v })}
              options={[
                { value: 'left',   title: 'Left',   label: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg> },
                { value: 'center', title: 'Center', label: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg> },
                { value: 'right',  title: 'Right',  label: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg> },
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PropLabel>Content</PropLabel>
            <ToggleGroup<'left' | 'center'>
              value={config.layout.contentAlign}
              onChange={(v) => setLayout({ contentAlign: v })}
              options={[
                { value: 'left',   title: 'Left',   label: 'Left' },
                { value: 'center', title: 'Center', label: 'Center' },
              ]}
            />
          </div>
        </PanelSection>

        {/* ── SECTIONS ───────────────────────────────────────────────── */}
        <PanelSection label="Sections">
          <p style={{ fontSize: 10, color: '#4b5563', marginBottom: 4 }}>Drag to reorder sections</p>
          <SectionOrderList order={config.layout.sectionOrder} onChange={(o) => setLayout({ sectionOrder: o })} />
        </PanelSection>

      </div>
    </div>
  );
}

// ─── Element override types & helpers ────────────────────────────────────────

interface ElOverride {
  tx?: number; ty?: number;
  pt?: number; pr?: number; pb?: number; pl?: number;
  fontSize?: number;
  color?: string;
  bg?: string;
  radius?: number;
  opacity?: number;
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return '#000000';
  return '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
}

function buildSelector(el: Element): string {
  const preview = document.getElementById(PREVIEW_ID);
  if (!preview) return '';
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== preview) {
    let seg = cur.tagName.toLowerCase();
    if (cur.id) { seg += `#${CSS.escape(cur.id)}`; parts.unshift(seg); break; }
    const parent = cur.parentElement;
    if (parent) seg += `:nth-child(${Array.from(parent.children).indexOf(cur) + 1})`;
    parts.unshift(seg);
    cur = cur.parentElement;
  }
  return `#${PREVIEW_ID} ${parts.join(' > ')}`;
}

function overrideToCss(selector: string, ov: ElOverride): string {
  const r: string[] = [];
  if (ov.tx !== undefined || ov.ty !== undefined) r.push(`transform: translate(${ov.tx ?? 0}px, ${ov.ty ?? 0}px) !important;`);
  if (ov.pt !== undefined) r.push(`padding-top: ${ov.pt}px !important;`);
  if (ov.pr !== undefined) r.push(`padding-right: ${ov.pr}px !important;`);
  if (ov.pb !== undefined) r.push(`padding-bottom: ${ov.pb}px !important;`);
  if (ov.pl !== undefined) r.push(`padding-left: ${ov.pl}px !important;`);
  if (ov.fontSize !== undefined) r.push(`font-size: ${ov.fontSize}px !important;`);
  if (ov.color)  r.push(`color: ${ov.color} !important;`);
  if (ov.bg)     r.push(`background-color: ${ov.bg} !important; background: ${ov.bg} !important;`);
  if (ov.radius !== undefined) r.push(`border-radius: ${ov.radius}px !important;`);
  if (ov.opacity !== undefined) r.push(`opacity: ${(ov.opacity / 100).toFixed(2)} !important;`);
  return r.length ? `${selector} { ${r.join(' ')} }` : '';
}

// ─── LivePreviewPane ──────────────────────────────────────────────────────────

interface SelInfo { el: Element; baseRect: DOMRect; selector: string; tag: string; classes: string[]; }
const ZOOM_OPTS = [0.25, 0.33, 0.5, 0.67, 0.75, 1.0];

function LivePreviewPane({ cssCode, configCode, profile, templateId, previewKey, effectiveCss, liveStyleRef }: {
  cssCode: string; configCode: string; profile: PublicProfilePayload; templateId: string;
  previewKey: number; effectiveCss: (css: string, cfg: string) => string;
  liveStyleRef: React.MutableRefObject<HTMLStyleElement | null>;
}) {
  const [zoom, setZoom]             = useState(0.5);
  const [selectMode, setSelectMode] = useState(false);
  const [hovRect, setHovRect]       = useState<DOMRect | null>(null);
  const [sel, setSel]               = useState<SelInfo | null>(null);
  const [overrides, setOverrides]   = useState<Record<string, ElOverride>>({});
  const [isDragging, setIsDragging] = useState(false);

  const overlayRef     = useRef<HTMLDivElement>(null);
  const overrideStyle  = useRef<HTMLStyleElement | null>(null);
  const dragStart      = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const scrollRef      = useRef<HTMLDivElement>(null);

  // Sync override CSS into separate style tag
  useEffect(() => {
    if (!overrideStyle.current) return;
    overrideStyle.current.textContent = Object.entries(overrides)
      .map(([s, ov]) => overrideToCss(s, ov)).filter(Boolean).join('\n');
  }, [overrides]);

  // Sync liveStyle when CSS props change
  useEffect(() => {
    if (liveStyleRef.current) liveStyleRef.current.textContent = effectiveCss(cssCode, configCode);
  }, [cssCode, configCode, effectiveCss, liveStyleRef]);

  // Refresh selection rect on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !sel) return;
    const onScroll = () => setSel((prev) => prev ? { ...prev } : null);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [sel]);

  const patchOverride = (s: string, patch: Partial<ElOverride>) =>
    setOverrides((prev) => ({ ...prev, [s]: { ...prev[s], ...patch } }));

  const getElUnder = (x: number, y: number): Element | null => {
    const overlay = overlayRef.current;
    const preview = document.getElementById(PREVIEW_ID);
    if (!overlay || !preview) return null;
    overlay.style.pointerEvents = 'none';
    (preview as HTMLElement).style.pointerEvents = 'auto';
    const el = document.elementFromPoint(x, y);
    (preview as HTMLElement).style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'auto';
    if (!el || !preview.contains(el) || el === preview) return null;
    return el;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!selectMode || isDragging || sel) return;
    const el = getElUnder(e.clientX, e.clientY);
    setHovRect(el ? el.getBoundingClientRect() : null);
  };

  const onOverlayClick = (e: React.MouseEvent) => {
    if (!selectMode) return;
    const el = getElUnder(e.clientX, e.clientY);
    if (el) {
      setSel({ el, baseRect: el.getBoundingClientRect(), selector: buildSelector(el), tag: el.tagName.toLowerCase(), classes: Array.from(el.classList) });
      setHovRect(null);
    } else {
      setSel(null);
    }
  };

  const onDragStart = (e: React.MouseEvent) => {
    if (!sel) return;
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
    const cur = overrides[sel.selector] ?? {};
    dragStart.current = { x: e.clientX, y: e.clientY, ox: cur.tx ?? 0, oy: cur.ty ?? 0 };
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - dragStart.current.x) / zoom;
      const dy = (ev.clientY - dragStart.current.y) / zoom;
      patchOverride(sel.selector, { tx: Math.round(dragStart.current.ox + dx), ty: Math.round(dragStart.current.oy + dy) });
    };
    const onUp = () => { setIsDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const liveRect = sel?.el.isConnected ? sel.el.getBoundingClientRect() : null;
  const selOv = sel ? (overrides[sel.selector] ?? {}) : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#060a12' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 36, padding: '0 12px', background: '#0b0e18', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1ECEFA', flexShrink: 0, animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, color: '#64748b' }}>Live Preview</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Select mode */}
          <button type="button" onClick={() => { setSelectMode((s) => !s); setSel(null); setHovRect(null); }}
            title={selectMode ? 'Exit select mode' : 'Click elements to inspect & style'}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: selectMode ? 'rgba(30,206,250,0.16)' : 'rgba(255,255,255,0.05)',
              color: selectMode ? '#1ECEFA' : '#64748b', transition: 'background 0.12s, color 0.12s' }}>
            {/* cursor arrow icon */}
            <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor"><path d="M4 0l16 12-7 2-3 8z"/></svg>
            {selectMode ? 'Selecting' : 'Select'}
          </button>

          {/* Zoom − */}
          <button type="button" onClick={() => setZoom((z) => Math.max(0.25, parseFloat((z - 0.08).toFixed(2))))}
            style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}>−</button>

          {/* Zoom select */}
          <select value={ZOOM_OPTS.includes(zoom) ? zoom : zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#9ca3af', fontSize: 10, padding: '3px 4px', borderRadius: 4, cursor: 'pointer', outline: 'none', width: 48, textAlign: 'center' }}>
            {ZOOM_OPTS.map((z) => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
          </select>

          {/* Zoom + */}
          <button type="button" onClick={() => setZoom((z) => Math.min(1.0, parseFloat((z + 0.08).toFixed(2))))}
            style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}>+</button>
        </div>
      </div>

      {/* ── Scroll area ── */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 24, background: '#09090f' }}>
        <div style={{ position: 'relative', width: Math.round(1280 * zoom), flexShrink: 0, alignSelf: 'flex-start' }}>
          {/* CSS injectors */}
          <style ref={(el) => { liveStyleRef.current = el; if (el) el.textContent = effectiveCss(cssCode, configCode); }} />
          <style ref={(el) => { overrideStyle.current = el; }} />

          {/* Template */}
          <div id={PREVIEW_ID} key={previewKey} style={{ zoom, width: 1280, pointerEvents: 'none', userSelect: 'none' }}>
            <PortfolioTemplateRenderer profile={profile} subdomain="preview" templateId={templateId} />
          </div>

          {/* Interaction overlay (select mode only) */}
          {selectMode && (
            <div ref={overlayRef}
              style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: isDragging ? 'grabbing' : 'crosshair' }}
              onMouseMove={onMouseMove}
              onMouseLeave={() => setHovRect(null)}
              onClick={onOverlayClick}
            />
          )}
        </div>
      </div>

      {/* ── Hover highlight (fixed, viewport coords) ── */}
      {selectMode && hovRect && !sel && !isDragging && (
        <div style={{ position: 'fixed', top: hovRect.top, left: hovRect.left, width: hovRect.width, height: hovRect.height,
          outline: '1px dashed rgba(30,206,250,0.7)', background: 'rgba(30,206,250,0.05)',
          pointerEvents: 'none', zIndex: 99996 }} />
      )}

      {/* ── Selection box (fixed) ── */}
      {sel && liveRect && (
        <div onMouseDown={onDragStart}
          style={{ position: 'fixed', top: liveRect.top, left: liveRect.left, width: liveRect.width, height: liveRect.height,
            outline: '2px solid #1ECEFA', zIndex: 99997,
            cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: isDragging ? 'none' : 'auto' }}>
          {/* Tag label */}
          <div style={{ position: 'absolute', top: -20, left: -1, background: '#1ECEFA', color: '#060a10',
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: '3px 3px 0 0', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {sel.tag}{sel.classes[0] ? `.${sel.classes[0]}` : ''}
          </div>
          {/* Resize corner dots */}
          {[{ top: -3, left: -3 }, { top: -3, right: -3 }, { bottom: -3, left: -3 }, { bottom: -3, right: -3 }].map((pos, i) => (
            <div key={i} style={{ position: 'absolute', width: 6, height: 6, background: '#fff', outline: '1.5px solid #1ECEFA', borderRadius: 1, ...pos }} />
          ))}
        </div>
      )}

      {/* ── Property panel (fixed, near selection) ── */}
      {sel && liveRect && (() => {
        const PW = 248, PH = 400;
        const top  = liveRect.bottom + 10 + PH > window.innerHeight ? Math.max(8, liveRect.top - PH - 10) : liveRect.bottom + 10;
        const left = Math.max(8, Math.min(liveRect.left, window.innerWidth - PW - 8));
        const cs   = sel.el.isConnected ? window.getComputedStyle(sel.el) : null;
        return (
          <div style={{ position: 'fixed', top, left, width: PW, zIndex: 99998,
            background: '#111114', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden', fontFamily: '"Inter", system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0d0d10', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sel.tag}{sel.classes.slice(0, 2).map((c) => `.${c}`).join('')}
              </span>
              <button type="button" onClick={() => setSel(null)}
                style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: '#6b7280', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>
            {/* Properties */}
            <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: PH - 40, overflowY: 'auto' }}>
              {/* Position */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Position — drag the blue box to move</span>
                <ScrubRow>
                  <Scrub flex1 label="X" value={selOv.tx ?? 0} onChange={(v) => patchOverride(sel.selector, { tx: v })} min={-800} max={800} step={1} unit="px" />
                  <Scrub flex1 label="Y" value={selOv.ty ?? 0} onChange={(v) => patchOverride(sel.selector, { ty: v })} min={-800} max={800} step={1} unit="px" />
                </ScrubRow>
              </div>
              {/* Padding */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Padding</span>
                <ScrubRow>
                  <Scrub flex1 label="T" value={selOv.pt ?? 0} onChange={(v) => patchOverride(sel.selector, { pt: v })} min={0} max={300} step={2} unit="px" />
                  <Scrub flex1 label="R" value={selOv.pr ?? 0} onChange={(v) => patchOverride(sel.selector, { pr: v })} min={0} max={300} step={2} unit="px" />
                </ScrubRow>
                <ScrubRow>
                  <Scrub flex1 label="B" value={selOv.pb ?? 0} onChange={(v) => patchOverride(sel.selector, { pb: v })} min={0} max={300} step={2} unit="px" />
                  <Scrub flex1 label="L" value={selOv.pl ?? 0} onChange={(v) => patchOverride(sel.selector, { pl: v })} min={0} max={300} step={2} unit="px" />
                </ScrubRow>
              </div>
              {/* Typography */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Typography</span>
                <Scrub label="Font size" value={selOv.fontSize ?? (cs ? parseInt(cs.fontSize) || 16 : 16)}
                  onChange={(v) => patchOverride(sel.selector, { fontSize: v })} min={8} max={160} step={1} unit="px" />
              </div>
              {/* Color */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Color</span>
                <ColorProp label="Text" value={selOv.color ?? (cs ? rgbToHex(cs.color) : '#e2e8f0')} onChange={(v) => patchOverride(sel.selector, { color: v })} />
                <ColorProp label="Fill" value={selOv.bg ?? '#111114'} onChange={(v) => patchOverride(sel.selector, { bg: v })} />
              </div>
              {/* Shape */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shape & Opacity</span>
                <ScrubRow>
                  <Scrub flex1 label="Radius"  value={selOv.radius  ?? 0}   onChange={(v) => patchOverride(sel.selector, { radius: v })}  min={0} max={120} step={1} unit="px" />
                  <Scrub flex1 label="Opacity" value={selOv.opacity ?? 100} onChange={(v) => patchOverride(sel.selector, { opacity: v })} min={0} max={100} step={5} unit="%" />
                </ScrubRow>
              </div>
              <ResetBtn onClick={() => setOverrides((prev) => { const n = { ...prev }; delete n[sel.selector]; return n; })}>
                Reset element
              </ResetBtn>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Code tab definitions ──────────────────────────────────────────────────────

const CODE_TABS: { key: EditorTab; label: string; dot: string; lang: string }[] = [
  { key: 'css',    label: 'styles.css',  dot: '#1ECEFA', lang: 'css'        },
  { key: 'config', label: 'config.json', dot: '#F59E0B', lang: 'json'       },
  { key: 'source', label: 'source.tsx',  dot: '#A78BFA', lang: 'typescript' },
];

// ─── Main Modal ────────────────────────────────────────────────────────────────

export function CodeEditorModal({ isOpen, onClose, templateId, profile, initialCss, initialConfig, onSave }: CodeEditorModalProps) {
  const template = getTemplateById(templateId);

  const fallbackCss = template.starterCss ??
    `/* ${template.name} — CSS Overrides */\n\nh1 {\n  /* font-size: 3rem !important; */\n}\n`;

  const defaultCss    = initialCss    || fallbackCss;
  const defaultConfig = initialConfig || serializeDesignConfig(defaultDesignConfig(template));

  // ── State ──
  const [mode, setMode]               = useState<AppMode>('code');
  const [tab, setTab]                 = useState<EditorTab>('css');
  const [cssCode, setCssCode]         = useState(defaultCss);
  const [configCode, setConfigCode]   = useState(defaultConfig);
  const [sourceCode, setSourceCode]   = useState('// Loading template source…');
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceSaving, setSourceSaving]   = useState(false);
  const [sourceSaved, setSourceSaved]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [cursorPos, setCursorPos]     = useState({ line: 1, col: 1 });
  const [previewKey, setPreviewKey]   = useState(0);
  const [splitPct, setSplitPct]       = useState(50);
  const [designConfig, setDesignConfig] = useState<DesignConfig>(() => parseDesignConfig(defaultConfig, template));

  const dragging     = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef    = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const liveStyleRef = useRef<HTMLStyleElement | null>(null);

  // Re-init on prop changes
  useEffect(() => {
    const css = initialCss || fallbackCss;
    const cfg = initialConfig || serializeDesignConfig(defaultDesignConfig(template));
    setCssCode(css);
    setConfigCode(cfg);
    setDesignConfig(parseDesignConfig(cfg, template));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCss, initialConfig, templateId]);

  // Fetch source on tab switch
  useEffect(() => {
    if (tab !== 'source') return;
    setSourceLoading(true);
    setSourceCode('// Loading…');
    fetch(`/api/template-source?id=${encodeURIComponent(templateId)}`)
      .then((r) => r.ok ? r.text() : Promise.reject(r.status))
      .then(setSourceCode)
      .catch(() => setSourceCode(`// Could not load source for "${templateId}"`))
      .finally(() => setSourceLoading(false));
  }, [tab, templateId]);

  // CSS injection
  const effectiveCss = useCallback((css: string, cfg: string) => HIDE_NAV_CSS + '\n' + css + '\n' + configToCss(cfg), []);

  const applyLive = useCallback((css: string, cfg: string) => {
    if (liveStyleRef.current) liveStyleRef.current.textContent = effectiveCss(css, cfg);
  }, [effectiveCss]);

  const handleDesignChange = useCallback((d: DesignConfig) => {
    setDesignConfig(d);
    const json = serializeDesignConfig(d);
    setConfigCode(json);
    applyLive(cssCode, json);
  }, [cssCode, applyLive]);

  const handleCssChange = useCallback((v: string | undefined) => {
    const val = v ?? '';
    setCssCode(val);
    applyLive(val, configCode);
  }, [configCode, applyLive]);

  const handleConfigChange = useCallback((v: string | undefined) => {
    const val = v ?? '';
    setConfigCode(val);
    setDesignConfig(parseDesignConfig(val, template));
    applyLive(cssCode, val);
  }, [cssCode, template, applyLive]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ css: cssCode, config: configCode });
      setSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaved(false), 2200);
    } catch { /* parent handles */ }
    finally { setSaving(false); }
  }, [cssCode, configCode, onSave]);

  const handleSaveSource = useCallback(async () => {
    setSourceSaving(true);
    try {
      const r = await fetch(`/api/template-source?id=${encodeURIComponent(templateId)}`, { method: 'PUT', body: sourceCode, headers: { 'Content-Type': 'text/plain' } });
      if (!r.ok) throw new Error(await r.text());
      setSourceSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSourceSaved(false), 2500);
    } catch (e) { alert(`Save failed: ${e instanceof Error ? e.message : e}`); }
    finally { setSourceSaving(false); }
  }, [templateId, sourceCode]);

  const handleReset = useCallback(() => {
    setCssCode(fallbackCss);
    const cfg = serializeDesignConfig(defaultDesignConfig(template));
    setConfigCode(cfg);
    setDesignConfig(parseDesignConfig(cfg, template));
    applyLive(fallbackCss, cfg);
    setPreviewKey((k) => k + 1);
  }, [fallbackCss, template, applyLive]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void (tab === 'source' ? handleSaveSource() : handleSave()); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, handleSave, handleSaveSource, onClose, tab]);

  // Drag-to-resize split pane
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setSplitPct(Math.min(75, Math.max(25, ((ev.clientX - r.left) / r.width) * 100)));
    };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const curTab   = CODE_TABS.find((t) => t.key === tab)!;
  const isSource = tab === 'source';
  const editorVal  = tab === 'css' ? cssCode : tab === 'config' ? configCode : sourceCode;
  const lineCount  = editorVal.split('\n').length;

  // ── Live Preview pane (shared between code and design modes) ─────────────
  const sharedPaneProps = { cssCode, configCode, profile, templateId, previewKey, effectiveCss, liveStyleRef };

  const modal = (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 99999, background: '#0d0d10', fontFamily: '"Inter", system-ui, sans-serif' }}
      role="dialog" aria-modal aria-label="Template Code Editor"
    >
      {/* ── Top bar ── */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#111115' }}>
        <CodeIco s={14} />
        <span className="text-[13px] font-semibold text-white">Code Editor</span>
        <span className="mx-1 text-[11px]" style={{ color: '#334155' }}>/</span>
        <span className="text-[11px]" style={{ color: '#64748b' }}>{template.name}</span>

        <span className="hidden sm:flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium border ml-1"
          style={{ background: template.accent + '18', borderColor: template.accent + '44', color: template.accent }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: template.accent }} />
          {template.id}
        </span>

        {/* Mode toggle */}
        <div className="ml-4 flex overflow-hidden rounded-lg border" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          {(['code', 'design'] as AppMode[]).map((m, i) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold transition-colors capitalize"
              style={{ background: mode === m ? '#1ECEFA' : 'transparent', color: mode === m ? '#060a10' : '#64748b', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : undefined }}>
              {m === 'code' ? <CodeIco s={11} /> : <PaletteIco s={11} />}
              {m}
            </button>
          ))}
        </div>

        {/* File tabs — code mode only */}
        {mode === 'code' && (
          <div className="ml-3 flex overflow-hidden rounded-md border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {CODE_TABS.map(({ key, label, dot }, i) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={{ background: tab === key ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === key ? '#fff' : '#64748b', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                {label}
                {key === 'source' && <span className="ml-0.5 rounded px-1 text-[9px] font-semibold" style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>tsx</span>}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {mode === 'code' && !isSource && (
            <>
              <button type="button" onClick={() => editorRef.current?.trigger('keyboard', 'undo', null)} title="Undo"
                className="flex h-7 w-7 items-center justify-center rounded border text-slate-400 hover:bg-white/5 hover:text-white transition-colors" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <RotateCcw size={12} />
              </button>
              <button type="button" onClick={() => editorRef.current?.trigger('keyboard', 'redo', null)} title="Redo"
                className="flex h-7 w-7 items-center justify-center rounded border text-slate-400 hover:bg-white/5 hover:text-white transition-colors" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <RedoIco s={12} />
              </button>
              <button type="button" onClick={handleReset}
                className="flex h-7 items-center gap-1 rounded border px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white transition-colors" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <Sparkles size={11} /> Reset
              </button>
              <div className="mx-1 h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <button type="button" onClick={() => void handleSave()} disabled={saving}
                className="flex h-7 items-center gap-1.5 rounded px-3 text-[12px] font-semibold transition-colors disabled:opacity-60"
                style={{ background: '#1ECEFA', color: '#060a10' }}>
                {saved ? <CheckCircle size={12} /> : <SaveIco s={12} />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
              </button>
            </>
          )}
          {mode === 'code' && isSource && (
            <>
              <span className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px]" style={{ background: 'rgba(234,179,8,0.12)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.25)' }}>
                <WarnIco s={11} /> modifies disk file
              </span>
              <button type="button" onClick={() => void handleSaveSource()} disabled={sourceSaving}
                className="flex h-7 items-center gap-1.5 rounded px-3 text-[12px] font-semibold transition-colors disabled:opacity-60"
                style={{ background: '#A78BFA', color: '#060a10' }}>
                {sourceSaved ? <CheckCircle size={12} /> : <SaveIco s={12} />}
                {sourceSaving ? 'Saving…' : sourceSaved ? 'Saved!' : 'Save Source'}
              </button>
            </>
          )}
          {mode === 'design' && (
            <>
              <button type="button" onClick={handleReset}
                className="flex h-7 items-center gap-1 rounded border px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white transition-colors" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <Sparkles size={11} /> Reset
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={saving}
                className="flex h-7 items-center gap-1.5 rounded px-3 text-[12px] font-semibold transition-colors disabled:opacity-60"
                style={{ background: '#1ECEFA', color: '#060a10' }}>
                {saved ? <CheckCircle size={12} /> : <SaveIco s={12} />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Design'}
              </button>
            </>
          )}
          <button type="button" onClick={onClose} title="Close (Esc)"
            className="flex h-7 w-7 items-center justify-center rounded border text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {mode === 'code' ? (
        <div ref={containerRef} className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex flex-col overflow-hidden" style={{ width: `${splitPct}%`, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex h-8 shrink-0 items-center gap-2 border-b px-3" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0f0f14' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: curTab.dot }} />
              <span className="text-[11px]" style={{ color: '#64748b' }}>{curTab.label}</span>
              {isSource && <span className="text-[10px]" style={{ color: '#A78BFA' }}>editable — saves to disk</span>}
              <span className="ml-auto text-[10px]" style={{ color: '#1e293b' }}>
                {tab === 'css' ? 'changes apply instantly →' : tab === 'config' ? 'updates preview live →' : 'Ctrl+S to save to disk'}
              </span>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {sourceLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#A78BFA] border-t-transparent" />
                </div>
              )}
              <MonacoEditorComponent
                height="100%" language={curTab.lang} value={editorVal}
                onChange={tab === 'css' ? handleCssChange : tab === 'config' ? handleConfigChange : (v) => setSourceCode(v ?? '')}
                onMount={(editor) => {
                  editorRef.current = editor as MonacoEditor.IStandaloneCodeEditor;
                  editor.onDidChangeCursorPosition((e) => setCursorPos({ line: e.position.lineNumber, col: e.position.column }));
                }}
                theme="vs-dark"
                options={{
                  fontSize: 13, lineHeight: 21,
                  fontFamily: '"JetBrains Mono", "Fira Code", Menlo, monospace',
                  fontLigatures: true,
                  minimap: { enabled: true, scale: 1, renderCharacters: false },
                  scrollBeyondLastLine: false, wordWrap: 'on',
                  renderLineHighlight: 'gutter', padding: { top: 12, bottom: 16 },
                  lineNumbers: 'on', glyphMargin: false, folding: true,
                  formatOnPaste: true, formatOnType: tab === 'config',
                  quickSuggestions: { other: true, comments: true, strings: true },
                  smoothScrolling: true, cursorSmoothCaretAnimation: 'on',
                  bracketPairColorization: { enabled: true }, colorDecorators: true,
                  scrollbar: { useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                  overviewRulerLanes: 0,
                }}
              />
            </div>
          </div>

          {/* Drag divider */}
          <div onMouseDown={startDrag} className="flex w-[5px] shrink-0 cursor-col-resize items-center justify-center transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <svg width="4" height="24" viewBox="0 0 4 24" fill="none">
              {[4, 10, 16].map((y) => <circle key={y} cx="2" cy={y} r="1.5" fill="rgba(255,255,255,0.2)" />)}
            </svg>
          </div>

          {/* Preview */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
            <LivePreviewPane {...sharedPaneProps} />
          </div>
        </div>
      ) : (
        /* DESIGN MODE: preview left | design panel right */
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
            <LivePreviewPane {...sharedPaneProps} />
          </div>
          <DesignPanel config={designConfig} template={template} onChange={handleDesignChange} />
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex h-6 shrink-0 items-center gap-4 border-t px-4" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#09090c' }}>
        {mode === 'code' && (
          <>
            <span className="text-[10px]" style={{ color: '#475569' }}>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span style={{ color: '#1e293b' }}>·</span>
            <span className="text-[10px]" style={{ color: '#475569' }}>{lineCount} lines</span>
            <span style={{ color: '#1e293b' }}>·</span>
            <span className="text-[10px]" style={{ color: '#475569' }}>{curTab.lang.toUpperCase()}</span>
          </>
        )}
        {mode === 'design' && (
          <span className="text-[10px]" style={{ color: '#475569' }}>Design mode — drag labels to scrub values, pick colors, choose fonts, reorder sections</span>
        )}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[10px]" style={{ color: '#334155' }}>Ctrl+S save</span>
          <span className="text-[10px]" style={{ color: '#334155' }}>Esc close</span>
          <span className="text-[10px]" style={{ color: '#1e293b' }}>Blox Editor</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
