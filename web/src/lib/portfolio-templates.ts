export interface PortfolioTemplateOption {
  id: string;
  name: string;
  description: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  layout: 'split-hero' | 'centered-cta' | 'timeline' | 'minimal' | 'grid-showcase';
  tags: string[];
  /** Starter CSS shown in the code editor for this template */
  starterCss?: string;
}

export const PORTFOLIO_TEMPLATE_OPTIONS: PortfolioTemplateOption[] = [
  {
    id: 'portfolio-modern-001',
    name: 'Nightfall Modern',
    description: 'Balanced hero layout with dark modern visuals.',
    accent: '#1ECEFA',
    bg: '#0C0F13',
    surface: '#131A23',
    text: '#E2E8F0',
    layout: 'split-hero',
    tags: ['dark', 'balanced', 'professional'],
    starterCss: `/* ═══════════════════════════════════════════════
   Nightfall Modern — CSS Overrides
   These rules are injected on top of the template.
   Use !important to override inline Tailwind styles.
═══════════════════════════════════════════════ */

/* ── Accent colour ─────────────────────────────
   Change the cyan (#1ECEFA) to any colour.      */
a, a:hover {
  color: #1ECEFA !important;
  text-decoration: none;
}

/* ── Hero heading ──────────────────────────────*/
h1 {
  font-size: 3.5rem !important;
  letter-spacing: -0.03em !important;
  line-height: 1.1 !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-size: 1.5rem !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  color: #1ECEFA !important;
}

/* ── Body text ─────────────────────────────────*/
p {
  line-height: 1.75 !important;
  color: #CBD5E1 !important;
}

/* ── Page background ───────────────────────────*/
body, [data-template-root] {
  background-color: #0C0F13 !important;
}

/* ── Card / surface colour ─────────────────────*/
[data-card], .rounded-2xl, .rounded-xl {
  background-color: #131A23 !important;
  border-color: rgba(30, 206, 250, 0.12) !important;
}`,
  },
  {
    id: 'portfolio-freelance-conversion',
    name: 'Freelance Conversion',
    description: 'Service-first layout with strong contact conversion.',
    accent: '#F59E0B',
    bg: '#0F0D0A',
    surface: '#1A1610',
    text: '#FEF3C7',
    layout: 'centered-cta',
    tags: ['dark', 'warm', 'cta-focused'],
    starterCss: `/* ═══════════════════════════════════════════════
   Freelance Conversion — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Amber accent colour ───────────────────────*/
a, a:hover { color: #F59E0B !important; }

/* ── Hero heading ──────────────────────────────*/
h1 {
  font-size: 3.25rem !important;
  font-weight: 800 !important;
  line-height: 1.15 !important;
}

/* ── CTA buttons ───────────────────────────────*/
button, [role="button"] {
  border-radius: 0.5rem !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #F59E0B !important;
  font-size: 1.4rem !important;
  font-weight: 700 !important;
}

/* ── Body text ─────────────────────────────────*/
p { color: #FEF3C7 !important; line-height: 1.8 !important; }

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #0F0D0A !important; }`,
  },
  {
    id: 'portfolio-timeline-dev',
    name: 'Dev Terminal',
    description: 'Technical layout tuned for engineering portfolios.',
    accent: '#22C55E',
    bg: '#060E06',
    surface: '#0D160D',
    text: '#BBF7D0',
    layout: 'timeline',
    tags: ['dark', 'technical', 'timeline'],
    starterCss: `/* ═══════════════════════════════════════════════
   Dev Terminal — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Green accent ──────────────────────────────*/
a, a:hover { color: #22C55E !important; }

/* ── Terminal-style heading ────────────────────*/
h1 {
  font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  font-size: 2.5rem !important;
  color: #22C55E !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  color: #22C55E !important;
  font-size: 1.1rem !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
}

/* ── Body text ─────────────────────────────────*/
p { color: #BBF7D0 !important; line-height: 1.75 !important; }

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #060E06 !important; }

/* ── Code / skill tags ─────────────────────────*/
code, pre, kbd {
  background-color: #0D160D !important;
  border: 1px solid #22C55E33 !important;
  border-radius: 0.25rem !important;
}`,
  },
  {
    id: 'portfolio-minimal-clean',
    name: 'Minimal Editorial',
    description: 'Clean typography-led layout with adaptive theme support.',
    accent: '#6366F1',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1E1B4B',
    layout: 'minimal',
    tags: ['light', 'minimal', 'typography'],
    starterCss: `/* ═══════════════════════════════════════════════
   Minimal Editorial — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Indigo accent ─────────────────────────────*/
a, a:hover { color: #6366F1 !important; }

/* ── Clean serif hero ──────────────────────────*/
h1 {
  font-family: 'Georgia', 'Times New Roman', serif !important;
  font-size: 3.75rem !important;
  font-weight: 700 !important;
  color: #1E1B4B !important;
  line-height: 1.1 !important;
  letter-spacing: -0.02em !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  color: #1E1B4B !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
}

/* ── Body text ─────────────────────────────────*/
p {
  color: #374151 !important;
  line-height: 1.8 !important;
  font-size: 1rem !important;
}

/* ── Page background ───────────────────────────*/
body, [data-template-root] { background-color: #FAFAFA !important; }`,
  },
  {
    id: 'portfolio-grid-showcase',
    name: 'Creative Gallery',
    description: 'Project-first layout with gallery-centric storytelling.',
    accent: '#FBBF24',
    bg: '#4A0916',
    surface: '#611126',
    text: '#FFE4E6',
    layout: 'grid-showcase',
    tags: ['dark', 'bold', 'grid'],
    starterCss: `/* ═══════════════════════════════════════════════
   Creative Gallery — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Gold accent ───────────────────────────────*/
a, a:hover { color: #FBBF24 !important; }

/* ── Bold hero ─────────────────────────────────*/
h1 {
  font-size: 4rem !important;
  font-weight: 900 !important;
  color: #FFE4E6 !important;
  line-height: 1.05 !important;
  letter-spacing: -0.04em !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #FBBF24 !important;
  font-size: 1.5rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.01em !important;
}

/* ── Body ──────────────────────────────────────*/
p { color: #FFE4E6 !important; line-height: 1.7 !important; }

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #4A0916 !important; }

/* ── Grid cards ────────────────────────────────*/
[data-card], article {
  background-color: #611126 !important;
  border-radius: 1rem !important;
  overflow: hidden !important;
}`,
  },
  {
    id: 'portfolio-neon-dev',
    name: 'Neon Dev',
    description: 'Cyber terminal aesthetic with vivid neon accents.',
    accent: '#8B5CF6',
    bg: '#050008',
    surface: '#12001B',
    text: '#DDD6FE',
    layout: 'timeline',
    tags: ['dark', 'neon', 'developer'],
    starterCss: `/* ═══════════════════════════════════════════════
   Neon Dev — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Purple neon accent ────────────────────────*/
a, a:hover { color: #8B5CF6 !important; }

/* ── Neon hero ─────────────────────────────────*/
h1 {
  font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  font-size: 2.75rem !important;
  color: #8B5CF6 !important;
  text-shadow: 0 0 30px rgba(139, 92, 246, 0.6) !important;
  line-height: 1.2 !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #A78BFA !important;
  font-family: 'JetBrains Mono', monospace !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
  font-size: 0.9rem !important;
}

/* ── Glowing borders ───────────────────────────*/
[data-card], .border {
  border-color: rgba(139, 92, 246, 0.3) !important;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.08) !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #050008 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #DDD6FE !important; line-height: 1.75 !important; }`,
  },
  {
    id: 'portfolio-glass-dev',
    name: 'Glass Dev',
    description: 'Soft glassmorphism UI with polished engineering sections.',
    accent: '#6366F1',
    bg: '#020617',
    surface: '#0F172A',
    text: '#E2E8F0',
    layout: 'split-hero',
    tags: ['dark', 'glass', 'developer'],
    starterCss: `/* ═══════════════════════════════════════════════
   Glass Dev — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Indigo accent ─────────────────────────────*/
a, a:hover { color: #6366F1 !important; }

/* ── Hero ──────────────────────────────────────*/
h1 {
  font-size: 3.25rem !important;
  font-weight: 700 !important;
  color: #F8FAFC !important;
  letter-spacing: -0.025em !important;
  line-height: 1.15 !important;
}

/* ── Glass cards ───────────────────────────────*/
[data-card], .backdrop-blur-md, .backdrop-blur {
  background: rgba(255, 255, 255, 0.04) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 1rem !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #6366F1 !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #020617 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #CBD5E1 !important; line-height: 1.8 !important; }`,
  },
  {
    id: 'portfolio-studio-designer',
    name: 'Studio Designer',
    description: 'Editorial designer portfolio with premium case-study flow.',
    accent: '#A855F7',
    bg: '#080812',
    surface: '#0F0F1A',
    text: '#F5D0FE',
    layout: 'grid-showcase',
    tags: ['dark', 'designer', 'case-study'],
    starterCss: `/* ═══════════════════════════════════════════════
   Studio Designer — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Purple accent ─────────────────────────────*/
a, a:hover { color: #A855F7 !important; }

/* ── Editorial hero ────────────────────────────*/
h1 {
  font-family: 'Georgia', serif !important;
  font-size: 3.5rem !important;
  font-weight: 700 !important;
  color: #F5D0FE !important;
  letter-spacing: -0.02em !important;
  line-height: 1.1 !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #A855F7 !important;
  font-size: 1.1rem !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
  font-weight: 600 !important;
}

/* ── Case study cards ──────────────────────────*/
[data-card], article {
  background-color: #0F0F1A !important;
  border: 1px solid rgba(168, 85, 247, 0.15) !important;
  border-radius: 0.75rem !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #080812 !important; }

/* ── Body ──────────────────────────────────────*/
p { color: #E9D5FF !important; line-height: 1.8 !important; }`,
  },
  {
    id: 'portfolio-canvas-designer',
    name: 'Canvas Designer',
    description: 'Warm creative canvas for visual storytelling portfolios.',
    accent: '#F97316',
    bg: '#FFF7ED',
    surface: '#FFFFFF',
    text: '#9A3412',
    layout: 'centered-cta',
    tags: ['light', 'designer', 'creative'],
    starterCss: `/* ═══════════════════════════════════════════════
   Canvas Designer — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Orange accent ─────────────────────────────*/
a, a:hover { color: #F97316 !important; }

/* ── Warm hero ─────────────────────────────────*/
h1 {
  font-family: 'Georgia', serif !important;
  font-size: 3.5rem !important;
  font-weight: 700 !important;
  color: #7C2D12 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.1 !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #EA580C !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
}

/* ── Cards / surfaces ──────────────────────────*/
[data-card], .bg-white {
  background-color: #FFFFFF !important;
  border: 1px solid #FED7AA !important;
  border-radius: 0.75rem !important;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.08) !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #FFF7ED !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #9A3412 !important; line-height: 1.75 !important; }`,
  },
  {
    id: 'portfolio-garden-studio',
    name: 'Garden Studio',
    description: 'Dark botanical aesthetic with pixel flowers, serif type and pink accents.',
    accent: '#ec4899',
    bg: '#051a1a',
    surface: '#0a2a2a',
    text: '#f8fafc',
    layout: 'centered-cta',
    tags: ['dark', 'designer', 'creative', 'minimal', 'botanical'],
    starterCss: `/* ═══════════════════════════════════════════════
   Garden Studio — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Pink botanical accent ─────────────────────*/
a, a:hover { color: #ec4899 !important; }

/* ── Serif hero ────────────────────────────────*/
h1 {
  font-family: 'Georgia', serif !important;
  font-size: 3.25rem !important;
  font-weight: 700 !important;
  color: #f8fafc !important;
  line-height: 1.15 !important;
  letter-spacing: -0.01em !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #ec4899 !important;
  font-family: 'Georgia', serif !important;
  font-size: 1.3rem !important;
  font-weight: 600 !important;
}

/* ── Body text ─────────────────────────────────*/
p { color: #f0fdf4 !important; line-height: 1.8 !important; }

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #051a1a !important; }

/* ── Surface cards ─────────────────────────────*/
[data-card], article {
  background-color: #0a2a2a !important;
  border: 1px solid rgba(236, 72, 153, 0.2) !important;
  border-radius: 0.75rem !important;
}`,
  },
  {
    id: 'portfolio-arcade',
    name: 'Arcade HUD',
    description: 'Retro space-shooter aesthetic with pixel art, scanlines and full HUD layout.',
    accent: '#00ff41',
    bg: '#050505',
    surface: '#0d0d0d',
    text: '#FFFFFF',
    layout: 'timeline',
    tags: ['dark', 'retro', 'arcade', 'pixel', 'developer'],
    starterCss: `/* ═══════════════════════════════════════════════
   Arcade HUD — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Matrix green accent ───────────────────────*/
a, a:hover { color: #00ff41 !important; }

/* ── Pixel hero ────────────────────────────────*/
h1 {
  font-family: 'Courier New', 'Courier', monospace !important;
  font-size: 2.5rem !important;
  color: #00ff41 !important;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.8) !important;
  line-height: 1.2 !important;
  letter-spacing: 0.05em !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-family: 'Courier New', monospace !important;
  color: #00ff41 !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  font-size: 0.875rem !important;
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.6) !important;
}

/* ── Scanline overlay simulation ───────────────*/
[data-template-root]::after {
  content: '' !important;
  position: fixed !important;
  top: 0; left: 0; right: 0; bottom: 0 !important;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.05) 2px,
    rgba(0, 0, 0, 0.05) 4px
  ) !important;
  pointer-events: none !important;
  z-index: 9999 !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #050505 !important; }`,
  },
  {
    id: 'portfolio-bento-studio',
    name: 'Bento Studio',
    description: 'Clean bento-grid portfolio for photographers and visual designers.',
    accent: '#171717',
    bg: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#171717',
    layout: 'grid-showcase',
    tags: ['light', 'minimal', 'designer', 'photographer'],
    starterCss: `/* ═══════════════════════════════════════════════
   Bento Studio — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Monochrome accent ─────────────────────────*/
a, a:hover { color: #171717 !important; text-decoration: underline !important; }

/* ── Clean hero ────────────────────────────────*/
h1 {
  font-size: 3.5rem !important;
  font-weight: 800 !important;
  color: #0a0a0a !important;
  letter-spacing: -0.04em !important;
  line-height: 1.05 !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
  color: #737373 !important;
}

/* ── Bento grid cells ──────────────────────────*/
[data-card], article {
  background-color: #FFFFFF !important;
  border: 1px solid #E5E5E5 !important;
  border-radius: 1.25rem !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #F5F5F5 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #404040 !important; line-height: 1.7 !important; }`,
  },
  {
    id: 'portfolio-alchemist',
    name: 'Digital Alchemist',
    description: 'Dark luxury single-page with animated Three.js torus knot & gold sparks, Playfair Display serif typography, and split hero.',
    accent: '#D4AF37',
    bg: '#050505',
    surface: '#0a0a0a',
    text: '#e5e5e5',
    layout: 'minimal',
    tags: ['dark', 'luxury', '3d', 'interactive', 'creative', 'webgl', 'serif'],
    starterCss: `/* ═══════════════════════════════════════════════
   Digital Alchemist — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Gold luxury accent ────────────────────────*/
a, a:hover { color: #D4AF37 !important; }

/* ── Playfair Display hero ─────────────────────*/
h1 {
  font-family: 'Playfair Display', 'Georgia', serif !important;
  font-size: 4rem !important;
  font-weight: 700 !important;
  color: #D4AF37 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.1 !important;
  font-style: italic !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-family: 'Playfair Display', 'Georgia', serif !important;
  color: #D4AF37 !important;
  font-size: 1.75rem !important;
  font-weight: 600 !important;
  font-style: italic !important;
}

/* ── Gold divider lines ────────────────────────*/
hr {
  border-color: rgba(212, 175, 55, 0.3) !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #050505 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #d4c5a0 !important; line-height: 1.8 !important; }`,
  },
  {
    id: 'portfolio-ramond',
    name: 'Ramond Holdings',
    description: 'Dark luxury real-estate & investment holding company aesthetic. Sticky scroll portfolio, horizontal ventures, bento stats, Cinzel serif typography.',
    accent: '#f97316',
    bg: '#050505',
    surface: '#080808',
    text: '#d6d3d1',
    layout: 'grid-showcase',
    tags: ['dark', 'luxury', 'corporate', 'real-estate', 'editorial', 'serif'],
    starterCss: `/* ═══════════════════════════════════════════════
   Ramond Holdings — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Orange corporate accent ───────────────────*/
a, a:hover { color: #f97316 !important; }

/* ── Cinzel serif hero ─────────────────────────*/
h1 {
  font-family: 'Cinzel', 'Georgia', serif !important;
  font-size: 3.5rem !important;
  font-weight: 700 !important;
  color: #fafaf9 !important;
  letter-spacing: 0.02em !important;
  line-height: 1.1 !important;
  text-transform: uppercase !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-family: 'Cinzel', 'Georgia', serif !important;
  color: #f97316 !important;
  font-size: 1.1rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  font-weight: 600 !important;
}

/* ── Bento stat cards ──────────────────────────*/
[data-card], article {
  background-color: #080808 !important;
  border: 1px solid rgba(249, 115, 22, 0.2) !important;
  border-radius: 0.5rem !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #050505 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #d6d3d1 !important; line-height: 1.75 !important; }`,
  },
  {
    id: 'portfolio-cinematic',
    name: 'Cinematic',
    description: 'Dark film-production aesthetic with video hero, marquee, bento services grid and masonry gallery.',
    accent: '#dc2626',
    bg: '#050505',
    surface: '#080808',
    text: '#e5e5e5',
    layout: 'grid-showcase',
    tags: ['dark', 'cinematic', 'creative', 'filmmaker', 'designer', 'bold'],
    starterCss: `/* ═══════════════════════════════════════════════
   Cinematic — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Cinematic red accent ──────────────────────*/
a, a:hover { color: #dc2626 !important; }

/* ── Film title hero ───────────────────────────*/
h1 {
  font-size: 4rem !important;
  font-weight: 900 !important;
  color: #FAFAFA !important;
  letter-spacing: -0.04em !important;
  line-height: 1.0 !important;
  text-transform: uppercase !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  color: #dc2626 !important;
  font-size: 0.8rem !important;
  letter-spacing: 0.2em !important;
  text-transform: uppercase !important;
  font-weight: 700 !important;
}

/* ── Gallery masonry items ─────────────────────*/
[data-card], article, figure {
  border-radius: 0 !important;
  overflow: hidden !important;
}

/* ── Background ────────────────────────────────*/
body, [data-template-root] { background-color: #050505 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #d1d5db !important; line-height: 1.7 !important; }`,
  },
  {
    id: 'portfolio-macos',
    name: 'macOS Desktop',
    description: 'Interactive macOS Ventura-style portfolio with draggable windows and dock.',
    accent: '#007aff',
    bg: '#1d3461',
    surface: '#ffffff',
    text: '#1e293b',
    layout: 'grid-showcase',
    tags: ['light', 'interactive', 'creative', 'unique', 'developer'],
    starterCss: `/* ═══════════════════════════════════════════════
   macOS Desktop — CSS Overrides
═══════════════════════════════════════════════ */

/* ── Apple blue accent ─────────────────────────*/
a, a:hover { color: #007aff !important; }

/* ── Window title bars ─────────────────────────*/
h1 {
  font-size: 2rem !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  letter-spacing: -0.01em !important;
}

/* ── Section headings ──────────────────────────*/
h2 {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  color: #64748b !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
}

/* ── macOS windows ─────────────────────────────*/
[data-card], [class*="window"], article {
  background: rgba(255,255,255,0.85) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(0,0,0,0.08) !important;
  border-radius: 0.75rem !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
}

/* ── Desktop background ────────────────────────*/
body, [data-template-root] { background-color: #1d3461 !important; }

/* ── Body text ─────────────────────────────────*/
p { color: #334155 !important; line-height: 1.6 !important; }`,
  },
];

export const DEFAULT_PORTFOLIO_TEMPLATE_ID = 'portfolio-modern-001';

export function normalizePortfolioTemplateId(raw: string | undefined | null) {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_PORTFOLIO_TEMPLATE_ID;
  const exists = PORTFOLIO_TEMPLATE_OPTIONS.some((item) => item.id === value);
  return exists ? value : DEFAULT_PORTFOLIO_TEMPLATE_ID;
}

export function getTemplateById(id: string): PortfolioTemplateOption {
  return (
    PORTFOLIO_TEMPLATE_OPTIONS.find((t) => t.id === id) ??
    PORTFOLIO_TEMPLATE_OPTIONS[0]
  );
}
