import type { PortfolioThemeConfig } from './PortfolioTemplateScaffold';

const DARK_CONTACT = {
  labelClassName: 'mb-1.5 block text-sm font-medium text-slate-300',
  inputClassName:
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20',
  textareaClassName:
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20',
  buttonClassName:
    'inline-flex w-full items-center justify-center rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200',
};

const LIGHT_CONTACT = {
  labelClassName: 'mb-1.5 block text-sm font-medium text-slate-700',
  inputClassName:
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-300/20',
  textareaClassName:
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-300/20',
  buttonClassName:
    'inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500',
};

export const NIGHTFALL_THEME: PortfolioThemeConfig = {
  rootClassName: 'bg-slate-950 text-slate-100',
  navClassName: 'bg-slate-950/85 text-slate-100',
  navBrandClassName: 'text-slate-100',
  navLinkClassName: 'rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:text-cyan-200',
  navActiveLinkClassName: 'text-cyan-200 underline underline-offset-4',
  heroTitleClassName: 'font-hero-title text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl',
  heroBodyClassName: 'max-w-2xl text-base leading-8 text-slate-300 sm:text-lg',
  heroPanelClassName: 'border border-cyan-300/15 bg-slate-900/80',
  sectionClassName: 'bg-slate-950 text-slate-100',
  sectionTitleClassName: 'font-hero-title text-3xl font-bold text-white',
  panelClassName: 'rounded-2xl border border-white/10 bg-slate-900/65 p-6',
  mutedTextClassName: 'text-slate-400',
  accentTextClassName: 'text-cyan-200',
  primaryButtonClassName: 'inline-flex items-center rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200',
  secondaryButtonClassName: 'inline-flex items-center rounded-xl border border-cyan-200/30 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-200/10',
  projectCardClassName: 'rounded-2xl border border-white/10 bg-slate-900/70',
  footerClassName: 'border-t border-white/10 bg-slate-950',
  footerLinkClassName: 'text-sm text-slate-400 transition hover:text-cyan-200',
  skillChipClassName: 'border-cyan-300/25 bg-cyan-300/10 text-slate-100',
  projectLinkClassName: 'text-sm font-semibold text-cyan-200 transition hover:text-cyan-100',
  projectTagClassName: 'rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-xs text-cyan-100',
  contactTheme: DARK_CONTACT,
};

export const FREELANCE_THEME: PortfolioThemeConfig = {
  rootClassName: 'bg-stone-50 text-stone-900',
  navClassName: 'bg-stone-50/90 text-stone-900',
  navBrandClassName: 'text-stone-900',
  navLinkClassName: 'rounded-md px-3 py-1.5 text-sm text-stone-600 transition hover:text-amber-700',
  navActiveLinkClassName: 'text-amber-700 underline underline-offset-4',
  heroTitleClassName: 'font-hero-title text-4xl font-bold leading-tight text-stone-900 sm:text-5xl lg:text-6xl',
  heroBodyClassName: 'max-w-2xl text-base leading-8 text-stone-600 sm:text-lg',
  heroPanelClassName: 'border border-amber-200 bg-amber-50',
  sectionClassName: 'bg-stone-50 text-stone-900',
  sectionTitleClassName: 'font-hero-title text-3xl font-bold text-stone-900',
  panelClassName: 'rounded-2xl border border-stone-200 bg-white p-6',
  mutedTextClassName: 'text-stone-600',
  accentTextClassName: 'text-amber-700',
  primaryButtonClassName: 'inline-flex items-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500',
  secondaryButtonClassName: 'inline-flex items-center rounded-xl border border-amber-500/30 px-5 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100',
  projectCardClassName: 'rounded-2xl border border-stone-200 bg-white',
  footerClassName: 'border-t border-stone-200 bg-white',
  footerLinkClassName: 'text-sm text-stone-600 transition hover:text-amber-700',
  skillChipClassName: 'border-amber-500/25 bg-amber-500/10 text-stone-900',
  projectLinkClassName: 'text-sm font-semibold text-amber-700 transition hover:text-amber-600',
  projectTagClassName: 'rounded-full border border-amber-400/30 bg-amber-100 px-2.5 py-1 text-xs text-amber-800',
  contactTheme: LIGHT_CONTACT,
};

export const DEV_TERMINAL_THEME: PortfolioThemeConfig = {
  rootClassName: 'bg-zinc-950 text-zinc-100',
  navClassName: 'bg-zinc-950/90 text-zinc-100',
  navBrandClassName: 'text-emerald-300',
  navLinkClassName: 'rounded-md px-3 py-1.5 text-sm text-zinc-400 transition hover:text-emerald-300',
  navActiveLinkClassName: 'text-emerald-300 underline underline-offset-4',
  heroTitleClassName: 'font-hero-title text-4xl font-bold leading-tight text-zinc-50 sm:text-5xl lg:text-6xl',
  heroBodyClassName: 'max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg',
  heroPanelClassName: 'border border-emerald-400/20 bg-zinc-900',
  sectionClassName: 'bg-zinc-950 text-zinc-100',
  sectionTitleClassName: 'font-hero-title text-3xl font-bold text-zinc-50',
  panelClassName: 'rounded-2xl border border-zinc-700 bg-zinc-900 p-6',
  mutedTextClassName: 'text-zinc-400',
  accentTextClassName: 'text-emerald-300',
  primaryButtonClassName: 'inline-flex items-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300',
  secondaryButtonClassName: 'inline-flex items-center rounded-xl border border-emerald-400/30 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-300/10',
  projectCardClassName: 'rounded-2xl border border-zinc-700 bg-zinc-900',
  footerClassName: 'border-t border-zinc-800 bg-zinc-950',
  footerLinkClassName: 'text-sm text-zinc-400 transition hover:text-emerald-300',
  skillChipClassName: 'border-emerald-400/25 bg-emerald-400/10 text-zinc-100',
  projectLinkClassName: 'text-sm font-semibold text-emerald-300 transition hover:text-emerald-200',
  projectTagClassName: 'rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200',
  contactTheme: {
    ...DARK_CONTACT,
    buttonClassName:
      'inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300',
  },
};

export const MINIMAL_THEME: PortfolioThemeConfig = {
  rootClassName: 'bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100',
  navClassName: 'bg-white/90 text-slate-900 dark:bg-slate-950/90 dark:text-slate-100',
  navBrandClassName: 'text-slate-900 dark:text-slate-100',
  navLinkClassName: 'rounded-md px-3 py-1.5 text-sm text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300',
  navActiveLinkClassName: 'text-indigo-600 underline underline-offset-4 dark:text-indigo-300',
  heroTitleClassName: 'font-hero-title text-4xl font-bold leading-tight text-slate-900 dark:text-slate-50 sm:text-5xl lg:text-6xl',
  heroBodyClassName: 'max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg',
  heroPanelClassName: 'border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900',
  sectionClassName: 'bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100',
  sectionTitleClassName: 'font-hero-title text-3xl font-bold text-slate-900 dark:text-slate-50',
  panelClassName: 'rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900',
  mutedTextClassName: 'text-slate-600 dark:text-slate-400',
  accentTextClassName: 'text-indigo-600 dark:text-indigo-300',
  primaryButtonClassName: 'inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300',
  secondaryButtonClassName: 'inline-flex items-center rounded-xl border border-indigo-600/25 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-300/30 dark:text-indigo-300 dark:hover:bg-indigo-300/10',
  projectCardClassName: 'rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  footerClassName: 'border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
  footerLinkClassName: 'text-sm text-slate-600 transition hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300',
  skillChipClassName: 'border-indigo-600/20 bg-indigo-500/10 text-slate-900 dark:border-indigo-300/25 dark:bg-indigo-300/10 dark:text-slate-100',
  projectLinkClassName: 'text-sm font-semibold text-indigo-700 transition hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200',
  projectTagClassName: 'rounded-full border border-indigo-600/20 bg-indigo-100 px-2.5 py-1 text-xs text-indigo-700 dark:border-indigo-300/25 dark:bg-indigo-300/10 dark:text-indigo-200',
  contactTheme: {
    ...LIGHT_CONTACT,
    buttonClassName:
      'inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300',
  },
};

export const SHOWCASE_THEME: PortfolioThemeConfig = {
  rootClassName: 'bg-rose-950 text-rose-50',
  navClassName: 'bg-rose-950/90 text-rose-50',
  navBrandClassName: 'text-rose-50',
  navLinkClassName: 'rounded-md px-3 py-1.5 text-sm text-rose-200/80 transition hover:text-rose-100',
  navActiveLinkClassName: 'text-rose-100 underline underline-offset-4',
  heroTitleClassName: 'font-hero-title text-4xl font-bold leading-tight text-rose-50 sm:text-5xl lg:text-6xl',
  heroBodyClassName: 'max-w-2xl text-base leading-8 text-rose-200 sm:text-lg',
  heroPanelClassName: 'border border-rose-300/20 bg-rose-900/40',
  sectionClassName: 'bg-rose-950 text-rose-50',
  sectionTitleClassName: 'font-hero-title text-3xl font-bold text-rose-50',
  panelClassName: 'rounded-2xl border border-rose-300/20 bg-rose-900/30 p-6',
  mutedTextClassName: 'text-rose-200/80',
  accentTextClassName: 'text-amber-200',
  primaryButtonClassName: 'inline-flex items-center rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-rose-950 transition hover:bg-amber-200',
  secondaryButtonClassName: 'inline-flex items-center rounded-xl border border-amber-200/30 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-200/10',
  projectCardClassName: 'rounded-2xl border border-rose-300/20 bg-rose-900/30',
  footerClassName: 'border-t border-rose-300/20 bg-rose-950',
  footerLinkClassName: 'text-sm text-rose-200/80 transition hover:text-amber-200',
  skillChipClassName: 'border-amber-200/30 bg-amber-200/10 text-rose-50',
  projectLinkClassName: 'text-sm font-semibold text-amber-200 transition hover:text-amber-100',
  projectTagClassName: 'rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-xs text-amber-100',
  contactTheme: {
    ...DARK_CONTACT,
    buttonClassName:
      'inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-rose-950 transition hover:bg-amber-200',
  },
};
