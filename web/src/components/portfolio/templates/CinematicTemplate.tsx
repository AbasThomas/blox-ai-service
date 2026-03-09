'use client';

import { useEffect, useRef } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';

interface CinematicTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

// ── helpers ────────────────────────────────────────────────────────────────────
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

function projectField(proj: unknown, ...keys: string[]): string {
  const r = asRecord(proj);
  for (const k of keys) if (asStr(r[k])) return asStr(r[k]);
  return '';
}

// ── icons ──────────────────────────────────────────────────────────────────────
const ArrowUpRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);
const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const Play = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const Mail = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const Instagram = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
  </svg>
);
const Link2 = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const SERVICE_ICONS = [
  // film reel
  <svg key="film" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="2" y="2" width="20" height="20" rx="2.18" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" /></svg>,
  // video camera
  <svg key="video" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
  // scissors
  <svg key="scissors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>,
  // palette
  <svg key="palette" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>,
  // music
  <svg key="music" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
  // monitor-play
  <svg key="monitor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M10 7.75l5 3-5 3v-6Z" fill="currentColor" stroke="none"/><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
];

const FALLBACK_SKILLS = ['Direction', 'Cinematography', 'Post-Production', 'Color Grading', 'Sound Design', 'Visual Storytelling'];
const FALLBACK_SERVICE_DESCS = [
  'Concept development, scriptwriting, and visual treatment. We build the creative blueprint for every project.',
  'High-quality production using state-of-the-art tools and techniques tailored to your vision.',
  'Refining and polishing raw material into a cohesive, compelling final deliverable.',
  'Defining mood, tone, and aesthetic through precise technical and creative decisions.',
  'Immersive audio design that heightens emotional impact and brings work to life.',
  '2D and 3D motion work that adds dimension and flair to any creative identity.',
];

// ── component ──────────────────────────────────────────────────────────────────

export function CinematicTemplate({ profile, subdomain }: CinematicTemplateProps) {
  const { user, sections } = profile;
  const name = user.fullName || 'Creative Professional';
  const headline = user.headline || 'Visual Storyteller';
  const about = asStr(sections.about) || asStr(sections.hero?.body) || '';
  const projects = sections.projects ?? [];
  const skills = sections.skills ?? [];
  const experience = sections.experience ?? [];
  const certifications = sections.certifications ?? [];

  // contact/social links
  const links = sections.links ?? [];
  const emailLink = links.find(
    (l) => l.url?.startsWith('mailto:') || l.label?.toLowerCase().includes('email'),
  );
  const email = emailLink?.url?.replace('mailto:', '') ?? '';
  const igLink = links.find(
    (l) => l.label?.toLowerCase().includes('instagram') || l.url?.includes('instagram'),
  );
  const portfolioLink = links.find(
    (l) => l.label?.toLowerCase().includes('website') || l.label?.toLowerCase().includes('portfolio'),
  );

  // marquee: skills or fallback cinematic terms
  const marqueeItems = skills.length > 0 ? skills : FALLBACK_SKILLS;
  // double for infinite scroll
  const marqueeDouble = [...marqueeItems, ...marqueeItems];

  // services: up to 6 skills as service entries
  const serviceSkills = skills.length > 0 ? skills.slice(0, 6) : FALLBACK_SKILLS;

  // hero image: first project image
  const heroBg = projectField(projects[0], 'imageUrl', 'image', 'coverUrl') || '';

  // vision media
  const visionMain = projectField(projects[0], 'imageUrl', 'image', 'coverUrl') || heroBg;
  const visionA = projectField(projects[1], 'imageUrl', 'image', 'coverUrl') || '';
  const visionB = projectField(projects[2], 'imageUrl', 'image', 'coverUrl') || '';

  // stats
  const projectStat = projects.length || '10+';
  const expStat = experience.length || '5+';

  // IntersectionObserver for fade-up
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('cin-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    root.querySelectorAll('.cin-fade').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // short brand name (first word)
  const brandWord = name.split(' ')[0];

  return (
    <div ref={sectionRef} style={{ fontFamily: "'Manrope', sans-serif", background: '#050505', color: '#e5e5e5', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700&display=swap');
        .cin-grain {
          position: fixed; top:0; left:0; width:100%; height:100%;
          pointer-events:none; z-index:9999; opacity:0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        @keyframes cin-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .cin-marquee { animation: cin-scroll 35s linear infinite; }
        .cin-marquee:hover { animation-play-state: paused; }
        .cin-fade { opacity:0; transform:translateY(28px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
        .cin-fade.cin-visible { opacity:1; transform:translateY(0); }
        .cin-delay-1 { transition-delay: 0.1s; }
        .cin-delay-2 { transition-delay: 0.2s; }
        .cin-delay-3 { transition-delay: 0.3s; }
        .cin-delay-4 { transition-delay: 0.4s; }
        .cin-project-card:hover .cin-project-overlay { opacity:0.9; }
        .cin-project-card:hover .cin-project-img { transform: scale(1.06); }
        .cin-project-card:hover .cin-project-meta { transform: translateY(0); }
        .cin-project-card:hover .cin-project-top { opacity:1; transform:translateY(0); }
        .cin-service:hover .cin-service-icon-wrap { border-color: rgba(220,38,38,0.5); }
        .cin-service:hover .cin-service-icon { color: #dc2626; }
        .cin-service::after {
          content:''; position:absolute; inset:0;
          border:1px solid rgba(255,255,255,0.1);
          transition: border-color 0.3s; pointer-events:none;
        }
        .cin-service:hover::after { border-color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#050505; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:#dc2626; }
        .cin-ping {
          animation: cin-ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        }
        @keyframes cin-ping { 75%,100%{transform:scale(2);opacity:0;} }
        .cin-pulse { animation: cin-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes cin-pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
      `}</style>

      <div className="cin-grain" />

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{
          backdropFilter: 'blur(24px)',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 9999,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>
          <a href="#" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            {brandWord}
            <span className="cin-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
          </a>
          <div style={{ display: 'flex', gap: 28, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a3a3a3' }}>
            {[['#vision', 'Vision'], ['#portfolio', 'Work'], ['#services', 'Services'], ['#contact', 'Contact']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#a3a3a3')}>
                {label}
              </a>
            ))}
          </div>
          <a href="#contact" style={{
            width: 32, height: 32, borderRadius: '50%', background: '#fff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, transform 0.2s', textDecoration: 'none',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#e5e5e5'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {heroBg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45, transform: 'scale(1.05)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 60%, #1a0a0a 0%, #050505 70%)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.4) 50%, rgba(0,0,0,0.3) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050505 110%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 20, textAlign: 'center', padding: '0 24px', maxWidth: 900, margin: '80px auto 0' }}>
          {/* Badge */}
          <div className="cin-fade" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px',
            borderRadius: 9999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)', marginBottom: 28,
          }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span className="cin-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(239,68,68,0.75)', display: 'block' }} />
              <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#d4d4d4' }}>
              {headline}
            </span>
          </div>

          {/* Heading */}
          <h1 className="cin-fade cin-delay-1" style={{ fontSize: 'clamp(52px, 10vw, 110px)', fontWeight: 600, letterSpacing: '-0.04em', color: '#fff', lineHeight: 0.9, marginBottom: 28 }}>
            {sections.hero?.heading?.split(' ').slice(0, -1).join(' ') || name}
            <br />
            <span style={{ background: 'linear-gradient(to bottom, #fff, #525252)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {sections.hero?.heading?.split(' ').slice(-1)[0] || 'resonate.'}
            </span>
          </h1>

          {/* Subtext */}
          <p className="cin-fade cin-delay-2" style={{ fontSize: 18, color: '#737373', fontWeight: 300, maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            {sections.hero?.body || about || 'Crafting high-fidelity experiences for brands and visionaries who dare to stand out.'}
          </p>

          {/* CTAs */}
          <div className="cin-fade cin-delay-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#portfolio" style={{
              position: 'relative', padding: '14px 28px',
              background: '#fff', color: '#000', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.05em', overflow: 'hidden', borderRadius: 2,
              display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
              transition: 'padding-right 0.3s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.paddingRight = '38px')}
              onMouseLeave={(e) => (e.currentTarget.style.paddingRight = '28px')}>
              View Work
              <Play size={11} />
            </a>
            <a href="#contact" style={{
              padding: '14px 28px', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 13, fontWeight: 500,
              letterSpacing: '0.05em', borderRadius: 2, textDecoration: 'none',
              backdropFilter: 'blur(8px)', transition: 'background 0.2s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              Start a Project
            </a>
          </div>
        </div>

        {/* Scroll line */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.4 }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, transparent, #fff, transparent)' }} />
        </div>
      </header>

      {/* ── Marquee ── */}
      <div style={{ width: '100%', background: 'rgba(23,23,23,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 0', overflow: 'hidden', backdropFilter: 'blur(8px)', position: 'relative', zIndex: 20 }}>
        <div className="cin-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', width: '200%' }}>
          {[0, 1].map((pass) => (
            <div key={pass} style={{ display: 'flex', alignItems: 'center', gap: 44, margin: '0 22px' }}>
              {marqueeItems.map((item, i) => (
                <span key={`${pass}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.08)' }}>
                    {item}
                  </span>
                  <span style={{ color: '#dc2626', fontSize: 20 }}>•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Vision ── */}
      <section id="vision" style={{ padding: '120px 0', position: 'relative' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 64, alignItems: 'start' }}>

            {/* Left sticky */}
            <div className="cin-fade" style={{ position: 'sticky', top: 120 }}>
              <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 14 }}>01 / The Vision</span>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1, marginBottom: 24 }}>
                We don&apos;t just deliver work. <br />
                <span style={{ color: '#525252' }}>We construct impact.</span>
              </h2>
              <p style={{ color: '#737373', fontWeight: 300, lineHeight: 1.8, marginBottom: 32, fontSize: 15 }}>
                {about || "Every decision is intentional. Every deliverable is crafted with raw emotion and technical precision. The work is designed to linger long after it\u2019s experienced."}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{projectStat}{typeof projectStat === 'number' && '+'}</span>
                  <span style={{ fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Projects Delivered</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{expStat}{typeof expStat === 'number' && '+'}</span>
                  <span style={{ fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Years Experience</span>
                </div>
                {certifications.length > 0 && (
                  <div>
                    <span style={{ display: 'block', fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{certifications.length}+</span>
                    <span style={{ fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Certifications</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right media grid */}
            <div className="cin-fade cin-delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Main large */}
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => { const img = e.currentTarget.querySelector('img') as HTMLImageElement | null; if (img) { img.style.transform = 'scale(1.05)'; img.style.opacity = '1'; } }}
                onMouseLeave={(e) => { const img = e.currentTarget.querySelector('img') as HTMLImageElement | null; if (img) { img.style.transform = 'scale(1)'; img.style.opacity = '0.8'; } }}>
                {visionMain ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={visionMain} alt={projectField(projects[0], 'title') || 'Project'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'transform 0.7s, opacity 0.4s' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em' }}>
                    {projectField(projects[0], 'title') || 'Narrative Depth'}
                  </h3>
                </div>
              </div>

              {/* Two smaller */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[{ proj: projects[1], img: visionA, label: 'Craft' }, { proj: projects[2], img: visionB, label: 'Precision' }].map(({ proj, img, label }, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={(e) => { const el = e.currentTarget.querySelector('img') as HTMLImageElement | null; if (el) { el.style.transform = 'scale(1.06)'; el.style.opacity = '1'; el.style.filter = 'grayscale(0%)'; } }}
                    onMouseLeave={(e) => { const el = e.currentTarget.querySelector('img') as HTMLImageElement | null; if (el) { el.style.transform = 'scale(1)'; el.style.opacity = '0.8'; el.style.filter = 'grayscale(80%)'; } }}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={projectField(proj, 'title') || label} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'grayscale(80%)', transition: 'transform 0.7s, opacity 0.4s, filter 0.4s' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: i === 0 ? 'linear-gradient(135deg, #1c1c1c, #0a0a0a)' : 'linear-gradient(135deg, #141414, #0d0d0d)' }} />
                    )}
                    <div style={{ position: 'absolute', bottom: 18, left: 18 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em' }}>
                        {projectField(proj, 'title') || label}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Selected Works ── */}
      <section id="portfolio" style={{ padding: '120px 0', background: '#080808', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="cin-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 8 }}>02 / Portfolio</span>
              <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.04em', color: '#fff' }}>Selected Works</h2>
            </div>
          </div>

          {projects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {projects.slice(0, 6).map((proj, i) => {
                const title = projectField(proj, 'title') || `Project ${i + 1}`;
                const img = projectField(proj, 'imageUrl', 'image', 'coverUrl');
                const tags = asRecord(proj).tags;
                const category = Array.isArray(tags) && tags.length > 0
                  ? asStr(tags[0])
                  : projectField(proj, 'category', 'type') || skills[i % skills.length] || 'Creative';
                const url = projectField(proj, 'url', 'link');
                const year = projectField(proj, 'year', 'date') || `${2023 + (i % 2)}`;

                return (
                  <div key={i} className="cin-project-card cin-fade" style={{
                    position: 'relative', aspectRatio: '3/4', overflow: 'hidden',
                    cursor: 'pointer', borderRadius: 2, border: '1px solid rgba(255,255,255,0.04)',
                    transitionDelay: `${(i % 3) * 0.1}s`,
                  }}
                    onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img} alt={title}
                        className="cin-project-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: 'transform 1s, opacity 0.5s' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${i * 40},15%,8%), hsl(${i * 40 + 20},10%,5%))` }} />
                    )}

                    {/* gradient */}
                    <div className="cin-project-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', opacity: 0.85, transition: 'opacity 0.5s' }} />

                    {/* content */}
                    <div style={{ position: 'absolute', inset: 0, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      {/* top badge */}
                      <div className="cin-project-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: 0, transform: 'translateY(-12px)', transition: 'opacity 0.5s, transform 0.5s' }}>
                        <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 9999, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {year}
                        </span>
                        <span style={{ color: '#fff', transform: 'rotate(45deg)', transition: 'transform 0.5s' }}>
                          <ArrowUpRight size={18} />
                        </span>
                      </div>
                      {/* bottom info */}
                      <div className="cin-project-meta" style={{ transform: 'translateY(12px)', transition: 'transform 0.5s' }}>
                        <p style={{ color: '#ef4444', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
                          {category}
                        </p>
                        <h3 style={{ fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>{title}</h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#525252' }}>
              <p style={{ fontSize: 14 }}>No projects yet. Add projects in your portfolio editor.</p>
            </div>
          )}

          <div className="cin-fade" style={{ marginTop: 56, textAlign: 'center' }}>
            <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.14em', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}>
              Start a Project
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" style={{ padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(127,29,29,0.1), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
          <div className="cin-fade" style={{ marginBottom: 56 }}>
            <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 8 }}>03 / Expertise</span>
            <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.04em', color: '#fff' }}>
              {skills.length > 0 ? 'Core Capabilities' : 'Production Services'}
            </h2>
          </div>

          {/* Bento grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
            {serviceSkills.map((skill, i) => (
              <div key={i} className="cin-service cin-fade" style={{
                position: 'relative',
                padding: '36px',
                borderRight: (i % 3 !== 2) ? '1px solid rgba(255,255,255,0.1)' : 'none',
                borderBottom: i < serviceSkills.length - 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                transition: 'background 0.2s',
                transitionDelay: `${(i % 3) * 0.1}s`,
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <div className="cin-service-icon-wrap" style={{
                  width: 44, height: 44, background: '#111', borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 28, border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'border-color 0.3s',
                }}>
                  <span className="cin-service-icon" style={{ color: '#d4d4d4', transition: 'color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {SERVICE_ICONS[i % SERVICE_ICONS.length]}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{skill}</h3>
                <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.7 }}>
                  {FALLBACK_SERVICE_DESCS[i % FALLBACK_SERVICE_DESCS.length]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery (project images) ── */}
      {projects.some((p) => projectField(p, 'imageUrl', 'image', 'coverUrl')) && (
        <section style={{ padding: '80px 0', background: '#080808' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>
            <div className="cin-fade">
              <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 8 }}>04 / Gallery</span>
              <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em', color: '#fff' }}>The Work, Up Close</h2>
            </div>
          </div>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 14, height: 540 }}>
            {projects.slice(0, 4).map((proj, i) => {
              const img = projectField(proj, 'imageUrl', 'image', 'coverUrl');
              if (!img) return null;
              const isFirst = i === 0;
              return (
                <div key={i} className="cin-fade" style={{
                  gridColumn: isFirst ? 'span 1' : undefined,
                  gridRow: isFirst ? 'span 2' : undefined,
                  position: 'relative', overflow: 'hidden', borderRadius: 2,
                  transitionDelay: `${i * 0.08}s`,
                }}
                  onMouseEnter={(e) => { const img = e.currentTarget.querySelector('img') as HTMLImageElement; if (img) { img.style.transform = 'scale(1.06)'; img.style.opacity = '1'; img.style.filter = 'grayscale(0%)'; } }}
                  onMouseLeave={(e) => { const img = e.currentTarget.querySelector('img') as HTMLImageElement; if (img) { img.style.transform = 'scale(1)'; img.style.opacity = '0.6'; img.style.filter = 'grayscale(100%)'; } }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={projectField(proj, 'title') || `Gallery ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'grayscale(100%)', transition: 'transform 0.7s, opacity 0.4s, filter 0.4s' }} />
                  {isFirst && (
                    <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                      {projectField(proj, 'title') || 'The Work'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Contact ── */}
      <section id="contact" style={{ padding: '120px 0', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, position: 'relative', zIndex: 10 }}>

          {/* Left */}
          <div className="cin-fade">
            <h2 style={{ fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: 600, letterSpacing: '-0.04em', color: '#fff', marginBottom: 24, lineHeight: 1 }}>
              Let&apos;s make<br />
              <span style={{ color: '#404040' }}>something great.</span>
            </h2>
            <p style={{ color: '#737373', fontSize: 17, fontWeight: 300, marginBottom: 48, maxWidth: 380, lineHeight: 1.7 }}>
              {sections.contact || 'Open to new collaborations, projects, and conversations. Reach out to discuss your vision.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {email && (
                <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#fff', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Email</span>
                    <span style={{ fontSize: 18, fontWeight: 500 }}>{email}</span>
                  </div>
                </a>
              )}

              {igLink && (
                <a href={igLink.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#fff', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Instagram size={18} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Follow</span>
                    <span style={{ fontSize: 18, fontWeight: 500 }}>{igLink.label || '@portfolio'}</span>
                  </div>
                </a>
              )}

              {portfolioLink && (
                <a href={portfolioLink.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#fff', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Link2 size={18} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Website</span>
                    <span style={{ fontSize: 18, fontWeight: 500 }}>{portfolioLink.label}</span>
                  </div>
                </a>
              )}

              {profile.resumeAssetId && (
                <div style={{ paddingTop: 8 }}>
                  <ResumeDownloadButton
                    subdomain={subdomain}
                    ownerName={name}
                    label="Download Resume"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white/10 text-sm font-medium text-white hover:border-red-500/50 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: form */}
          <div className="cin-fade cin-delay-2" style={{ background: 'rgba(23,23,23,0.3)', padding: 40, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, backdropFilter: 'blur(8px)' }}>
            <ContactForm
              recipientEmail={email}
              theme={{
                formClassName: 'space-y-8',
                labelClassName: 'block text-xs text-neutral-500 uppercase tracking-widest mb-2',
                inputClassName: 'w-full bg-transparent border-b border-neutral-700 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors',
                textareaClassName: 'w-full bg-transparent border-b border-neutral-700 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none',
                buttonClassName: 'w-full py-4 bg-white text-black text-sm font-semibold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3',
                successClassName: 'p-4 border border-green-800 bg-green-900/20 text-sm text-green-400 rounded-sm',
                errorClassName: 'mt-1 text-xs text-red-500',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#000', padding: '44px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <a href="#" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            {brandWord}<span style={{ color: '#dc2626' }}>.</span>
          </a>
          <p style={{ color: '#404040', fontSize: 11 }}>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {links.slice(0, 3).map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#525252')}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
