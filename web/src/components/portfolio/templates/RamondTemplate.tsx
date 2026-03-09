'use client';

import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';

interface RamondTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

const asStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const ArrowUpRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);
const ArrowDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
  </svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const BarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const Globe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const Sprout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 1 1.3 4.9c-1.1.9-2.5 1.3-3.9 1.3-.5-1.7-.5-3.3 0-4.6.5-1.3 1.4-2.3 2.6-1.6z" />
  </svg>
);
const Layers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);
const Cpu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const VENTURE_ICONS = [<BarChart key="b" />, <Globe key="g" />, <Sprout key="s" />, <Layers key="l" />, <Cpu key="c" />, <BarChart key="b2" />];
const VENTURE_COLORS = [
  { bg: 'rgba(234,88,12,0.15)', color: '#f97316' },
  { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
  { bg: 'rgba(6,182,212,0.15)', color: '#22d3ee' },
  { bg: 'rgba(244,63,94,0.15)', color: '#fb7185' },
];

const MARQUEE_CITIES = ['New York', 'London', 'Singapore', 'Dubai', 'Tokyo', 'Paris', 'Sydney', 'Berlin'];

export function RamondTemplate({ profile, subdomain }: RamondTemplateProps) {
  const { user, sections } = profile;

  const name = user.fullName || 'Holdings';
  const brandName = name.split(' ')[0].toUpperCase();
  const headline = user.headline || 'Timeless Assets, Modern Velocity.';
  const about = asStr(sections.about) || asStr(asRecord(sections.hero).body) || '';
  const projects = sections.projects ?? [];
  const skills = sections.skills ?? [];
  const experience = sections.experience ?? [];
  const contact = asRecord(sections.contact ?? {});
  const email = asStr(contact.email) || '';
  const heroImage = user.avatarUrl || projects[0]?.imageUrl || projects[0]?.snapshotUrl || '';

  // Stats
  const yearsActive = experience.length > 0
    ? `${experience.length * 3}+`
    : '10+';
  const assetsManaged = `$${(projects.length * 0.8 + 1).toFixed(1)}B`;

  // Parallax break image
  const breakImage = projects[1]?.imageUrl || projects[1]?.snapshotUrl || heroImage;

  // Interior images from projects
  const interiorSlides = projects.slice(0, 4).map((p, i) => ({
    image: p.snapshotUrl || p.imageUrl || p.images?.[0]?.url || '',
    label: p.title || `Project ${i + 1}`,
  }));

  // Ventures from skills (or fallback)
  const ventures = skills.length > 0
    ? skills.slice(0, 6).map((s, i) => ({ label: s, desc: '' }))
    : [
        { label: 'Equity Fund I', desc: 'Early-stage proptech startups revolutionizing how we interact with physical spaces.' },
        { label: 'Global Logistics', desc: 'Acquiring key infrastructure nodes to support next-generation supply chain demands.' },
        { label: 'Green Bond II', desc: 'Sustainable development financing for net-zero carbon certified projects.' },
        { label: 'Hospitality REIT', desc: 'Curated boutique hotels in high-barrier-to-entry heritage locations.' },
        { label: 'Urban Renewal', desc: 'Partnerships with local governments to revitalize historic districts.' },
        { label: 'Data Infra', desc: 'Developing hyperscale data centers powered by renewable energy in Nordic regions.' },
      ];

  const philosophyText = about ||
    'In an era of digital abstraction, the tangible value of well-positioned real estate remains the bedrock of wealth preservation. We operate at the intersection of high finance and high design, identifying undervalued assets in gateway cities and unlocking their potential through rigorous architectural intervention.';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Inter:wght@200;300;400;500&display=swap');
        .ramond-root { font-family: 'Inter', sans-serif; }
        .ramond-display { font-family: 'Cinzel', serif; }
        @keyframes ramond-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ramond-marquee { animation: ramond-marquee 40s linear infinite; }
        .ramond-hide-scrollbar::-webkit-scrollbar { display: none; }
        .ramond-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ramond-project::-webkit-scrollbar { width: 0; }
        .ramond-reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.4s ease, transform 0.4s ease; }
        .ramond-project-card:hover .ramond-reveal { opacity: 1; transform: translateY(0); }
        .ramond-project-card:hover .ramond-img { filter: grayscale(0); transform: scale(1); }
        .ramond-project-card:hover .ramond-title { color: #ffffff; }
        .ramond-project-card:hover .ramond-cta { background: #ffffff; color: #000000; }
        .ramond-parallax-bg { background-attachment: fixed; background-size: cover; background-position: center; }
      `}</style>

      <div className="ramond-root" style={{ background: '#050505', color: '#d6d3d1', minHeight: '100vh' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          mixBlendMode: 'difference', color: '#ffffff',
          padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className="ramond-display" style={{ fontSize: 20, letterSpacing: '-0.02em', fontWeight: 600 }}>
            {brandName}
          </span>
          <div style={{ display: 'flex', gap: 32 }}>
            {['Portfolio', 'Interiors', 'Ventures'].map((item) => (
              <a key={item} href={`#ramond-${item.toLowerCase()}`}
                style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', color: 'inherit', opacity: 0.9 }}>
                {item}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Hero ── */}
        <header style={{
          position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', paddingTop: 128, paddingBottom: 48, padding: '128px 48px 48px',
          borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
        }}>
          {/* Ambient glows */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 500, background: 'rgba(68,64,60,0.1)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 600, height: 600, background: 'rgba(154,52,18,0.05)', borderRadius: '50%', filter: 'blur(150px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
              <span style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#78716c', fontWeight: 500 }}>Est. {new Date().getFullYear() - (experience.length * 3 || 10)}</span>
            </div>
            <h1 className="ramond-display" style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)', color: '#f5f5f4', lineHeight: 0.9, letterSpacing: '-0.02em', margin: 0 }}>
              {headline.includes(',')
                ? <>
                    {headline.split(',')[0]},<br />
                    <span style={{ color: '#44403c' }}>{headline.split(',').slice(1, 2).join(',')}</span>
                    {headline.split(',').length > 2 && <><br /><em style={{ fontStyle: 'italic', color: '#f5f5f4' }}>{headline.split(',').slice(2).join(',')}</em></>}
                  </>
                : <>Timeless <br /><span style={{ color: '#44403c' }}>Assets</span>, Modern<br /><em>Velocity.</em></>
              }
            </h1>
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ maxWidth: 320, fontSize: 14, color: '#78716c', lineHeight: 1.7, fontWeight: 300 }}>
              {'Curating a portfolio of architectural landmarks and high-yield ventures across the globe.'}
            </p>
            <div style={{ color: '#57534e', animation: 'bounce 1s infinite' }}><ArrowDown /></div>
          </div>
        </header>

        {/* ── Marquee ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 0', overflow: 'hidden', background: '#050505' }}>
          <div className="ramond-marquee" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 64 }}>
            {[...MARQUEE_CITIES, ...MARQUEE_CITIES, ...MARQUEE_CITIES, ...MARQUEE_CITIES].map((city, i) => (
              <span key={i} className="ramond-display" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#292524' }}>{city}</span>
            ))}
          </div>
        </div>

        {/* ── Portfolio ── */}
        <section id="ramond-portfolio" style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>

            {/* Sticky sidebar */}
            <div style={{
              width: 'min(33.333%, 400px)', minWidth: 280, position: 'sticky', top: 0, height: '100vh',
              padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.05)', background: '#050505', zIndex: 10,
            }}>
              <span style={{ fontSize: 11, color: '#f97316', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 24, display: 'block' }}>The Portfolio</span>
              <h2 className="ramond-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)', color: '#ffffff', marginBottom: 24, lineHeight: 1.2 }}>Built for<br />Generations.</h2>
              <p style={{ color: '#78716c', fontSize: 13, lineHeight: 1.8, marginBottom: 32, maxWidth: 320 }}>
                Our approach combines rigorous analytical precision with an artist&apos;s appreciation for form and space. We don&apos;t just hold assets — we elevate them.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {['Residential', 'Commercial', 'Industrial'].map((cat) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 48, height: 1, background: '#44403c', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: '#a8a29e', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div style={{ flex: 1, background: '#080808' }}>
              {(projects.length > 0 ? projects : Array(3).fill(null)).map((proj, i) => {
                const p = proj ?? {};
                const title = asStr(p.title) || `0${i + 1}. Featured Project`;
                const desc = asStr(p.description) || 'A landmark asset combining architectural excellence with exceptional returns.';
                const img = asStr(p.snapshotUrl) || asStr(p.imageUrl) || (Array.isArray(p.images) ? asStr(p.images?.[0]?.url) : '');
                const url = asStr(p.url) || '#';
                const num = String(i + 1).padStart(2, '0');

                return (
                  <div key={i} className="ramond-project-card" style={{
                    position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
                    padding: '64px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.5s ease', cursor: 'pointer',
                  }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                        <h3 className="ramond-display ramond-title" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)', color: '#d6d3d1', transition: 'color 0.3s' }}>
                          {num}. {title}
                        </h3>
                        <span style={{ fontSize: 11, color: '#57534e', fontFamily: 'monospace' }}>{new Date().getFullYear() - i}</span>
                      </div>

                      <div style={{ position: 'relative', aspectRatio: '16/10', width: '100%', overflow: 'hidden', background: '#1c1917', marginBottom: 32 }}>
                        {img
                          ? <img src={img} alt={title} className="ramond-img" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)', transform: 'scale(1.1)', transition: 'filter 0.7s ease, transform 1s ease' }} />
                          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span className="ramond-display" style={{ fontSize: 40, color: '#44403c', opacity: 0.4 }}>{num}</span>
                            </div>
                        }
                        <div className="ramond-reveal" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <p style={{ color: '#ffffff', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                              {proj?.tags?.[0] ?? 'Featured Asset'}
                            </p>
                            <p style={{ color: '#d6d3d1', fontFamily: 'monospace', fontSize: 10 }}>
                              {proj?.tags?.[1] ?? 'Prime Location'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
                        <p style={{ color: '#78716c', fontSize: 13, maxWidth: 400, lineHeight: 1.7 }}>{desc}</p>
                        <a href={url} target="_blank" rel="noreferrer"
                          className="ramond-cta"
                          style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', transition: 'all 0.3s', textDecoration: 'none', flexShrink: 0 }}>
                          <ArrowUpRight />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Parallax Break ── */}
        <div style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2 className="ramond-display" style={{ fontSize: 'clamp(2rem, 6vw, 5rem)', color: '#ffffff', letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.2 }}>
              Architecture as<br /><em>Asset Class.</em>
            </h2>
          </div>
          {breakImage
            ? <div className="ramond-parallax-bg" style={{ width: '100%', height: '100%', backgroundImage: `url(${breakImage})` }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)' }} />
          }
        </div>

        {/* ── Interiors (horizontal scroll) ── */}
        <section id="ramond-interiors" style={{ padding: '96px 0', background: '#050505', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '0 48px', marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span style={{ fontSize: 11, color: '#f97316', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Inner Sanctums</span>
              <h2 className="ramond-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#ffffff' }}>Interior Design</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scroll</span>
              <ArrowRight />
            </div>
          </div>

          <div className="ramond-hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '0 48px 32px', scrollSnapType: 'x mandatory' }}>
            {(interiorSlides.length > 0 ? interiorSlides : Array(4).fill({ image: '', label: 'Interior' })).map((slide, i) => (
              <div key={i} style={{ minWidth: 'min(80vw, 640px)', scrollSnapAlign: 'center', position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#1c1917', cursor: 'pointer' }}>
                {slide.image
                  ? <img src={slide.image} alt={slide.label} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'transform 0.7s ease, opacity 0.3s ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLImageElement).style.opacity = '0.8'; }} />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #1c1917, #292524)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="ramond-display" style={{ fontSize: 32, color: '#44403c', opacity: 0.3 }}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                }
                <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10 }}>
                  <span style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#ffffff', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {slide.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Philosophy ── */}
        <section style={{ padding: '96px 48px', background: '#050505', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px 128px' }}>
            <div>
              <span style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 24, display: 'block' }}>The Philosophy</span>
              <h3 className="ramond-display" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', color: '#ffffff', lineHeight: 1.3 }}>
                We believe in the &ldquo;Spatial Integrity&rdquo; of capital.
              </h3>
            </div>
            <div>
              <p style={{ color: '#a8a29e', fontSize: 13, lineHeight: 1.9, marginBottom: 24 }}>{philosophyText}</p>
              {philosophyText.length < 200 && (
                <p style={{ color: '#a8a29e', fontSize: 13, lineHeight: 1.9 }}>
                  Our multidisciplinary approach allows us to see value where others see only concrete — combining financial precision with architectural intelligence.
                </p>
              )}
              <div style={{ display: 'flex', gap: 48, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32, marginTop: 32 }}>
                <div>
                  <span className="ramond-display" style={{ display: 'block', fontSize: 32, color: '#ffffff', marginBottom: 4 }}>{assetsManaged}</span>
                  <span style={{ fontSize: 10, color: '#57534e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Assets Managed</span>
                </div>
                <div>
                  <span className="ramond-display" style={{ display: 'block', fontSize: 32, color: '#ffffff', marginBottom: 4 }}>0%</span>
                  <span style={{ fontSize: 10, color: '#57534e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Vacancy</span>
                </div>
                <div>
                  <span className="ramond-display" style={{ display: 'block', fontSize: 32, color: '#ffffff', marginBottom: 4 }}>{experience.length || 12}</span>
                  <span style={{ fontSize: 10, color: '#57534e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Global Hubs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ventures ── */}
        <section id="ramond-ventures" style={{ padding: '96px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#050505' }}>
          <div style={{ padding: '0 48px', marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span style={{ fontSize: 11, color: '#f97316', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Ventures</span>
              <h2 className="ramond-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#ffffff' }}>Strategic Growth</h2>
            </div>
          </div>

          <div className="ramond-hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: 24, padding: '0 48px 48px', scrollSnapType: 'x mandatory' }}>
            {ventures.map((v, i) => {
              const vc = VENTURE_COLORS[i % VENTURE_COLORS.length];
              return (
                <div key={i} style={{
                  minWidth: 380, scrollSnapAlign: 'center',
                  background: 'rgba(28,25,23,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                  padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'border-color 0.3s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  <div style={{ marginBottom: 48 }}>
                    <div style={{ width: 40, height: 40, background: vc.bg, color: vc.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                      {VENTURE_ICONS[i % VENTURE_ICONS.length]}
                    </div>
                    <h3 className="ramond-display" style={{ fontSize: 18, color: '#ffffff', marginBottom: 12 }}>{v.label}</h3>
                    <p style={{ color: '#78716c', fontSize: 13, fontWeight: 300, lineHeight: 1.7 }}>
                      {v.desc || `Strategic ${v.label} initiatives designed to generate superior risk-adjusted returns across market cycles.`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                    <span style={{ fontSize: 11, color: '#57534e', fontFamily: 'monospace' }}>Active</span>
                    <span style={{ fontSize: 11, color: '#57534e', cursor: 'pointer' }}>Details ⤨</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Bento Stats ── */}
        <section style={{ padding: '96px 48px', background: '#050505' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {/* Large block */}
            <div style={{ gridColumn: 'span 2', gridRow: 'span 2', position: 'relative', background: '#1c1917', borderRadius: 8, overflow: 'hidden', minHeight: 280 }}>
              {heroImage && <img src={heroImage} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, transition: 'transform 0.7s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
              />}
              <div style={{ position: 'relative', zIndex: 10, padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <h3 className="ramond-display" style={{ fontSize: 28, color: '#ffffff', marginBottom: 8 }}>{name}</h3>
                <p style={{ color: '#d6d3d1', fontSize: 13, fontWeight: 300 }}>Leadership defined by decades of proven stewardship.</p>
              </div>
            </div>

            <div style={{ background: 'rgba(28,25,23,0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: 32, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span className="ramond-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#ffffff', fontWeight: 300, marginBottom: 8 }}>{assetsManaged}</span>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#78716c' }}>Assets Managed</span>
            </div>

            <div style={{ background: 'rgba(28,25,23,0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: 32, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span className="ramond-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#ffffff', fontWeight: 300, marginBottom: 8 }}>{yearsActive}</span>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#78716c' }}>Years Active</span>
            </div>

            <div style={{ gridColumn: 'span 2', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.3s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}>
              <div>
                <span style={{ fontSize: 11, color: '#f97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Latest Insight</span>
                <h4 style={{ fontSize: 16, color: '#ffffff', fontWeight: 300 }}>The shift towards experiential real assets in {new Date().getFullYear()}.</h4>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowRight />
              </div>
            </div>
          </div>
        </section>

        {/* ── Resume ── */}
        {profile.resumeAssetId && (
          <div style={{ padding: '0 48px 48px', display: 'flex', justifyContent: 'center' }}>
            <ResumeDownloadButton
              subdomain={subdomain}
              ownerName={name}
              label="Download Prospectus"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '14px 40px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif', cursor: 'pointer' }}
            />
          </div>
        )}

        {/* ── Footer ── */}
        <footer style={{ background: '#0c0a09', paddingTop: 96, paddingBottom: 48, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '0 48px', maxWidth: 1440, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 96 }}>
              <h2 className="ramond-display" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#f5f5f4', letterSpacing: '-0.03em', lineHeight: 0.85, margin: 0 }}>
                Build <br /><span style={{ color: '#44403c' }}>Legacy.</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                {email ? (
                  <>
                    <a href={`mailto:${email}`} style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: '#ffffff', fontWeight: 300, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                      Start an Enquiry <span style={{ transition: 'transform 0.3s' }}>→</span>
                    </a>
                    <p style={{ color: '#78716c', fontSize: 13 }}>{email}</p>
                  </>
                ) : (
                  <div style={{ maxWidth: 400, width: '100%' }}>
                    <ContactForm
                      recipientEmail={email || undefined}
                      theme={{
                        formClassName: 'space-y-4',
                        labelClassName: 'mb-1 block text-xs font-medium text-stone-500 uppercase tracking-widest',
                        inputClassName: 'w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20',
                        textareaClassName: 'w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20',
                        buttonClassName: 'w-full bg-white text-black px-6 py-3 text-xs font-medium uppercase tracking-widest hover:bg-stone-200 transition-colors',
                        successClassName: 'border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300',
                        errorClassName: 'mt-1 text-xs text-rose-400',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 48 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 10, color: '#78716c', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Sitemap</span>
                {['Home', 'Projects', 'Philosophy', 'News'].map((link) => (
                  <a key={link} href="#" style={{ fontSize: 13, color: '#d6d3d1', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#d6d3d1'; }}>{link}</a>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 10, color: '#78716c', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Social</span>
                {['LinkedIn', 'Instagram', 'Twitter (X)'].map((link) => (
                  <a key={link} href="#" style={{ fontSize: 13, color: '#d6d3d1', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#d6d3d1'; }}>{link}</a>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 10, color: '#78716c', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Legal</span>
                {['Privacy', 'Terms'].map((link) => (
                  <a key={link} href="#" style={{ fontSize: 13, color: '#d6d3d1', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#d6d3d1'; }}>{link}</a>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: '#44403c', letterSpacing: '0.2em', textTransform: 'uppercase' }}>© {new Date().getFullYear()} {name}</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
