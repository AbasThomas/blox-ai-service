'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';

interface ArcadeTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

// ── SVG sprites ───────────────────────────────────────────────────────────────

function EnemySprite() {
  return (
    <svg width="80" height="54" viewBox="0 0 15 10" fill="#ff0055"
      className="drop-shadow-[0_0_8px_rgba(255,0,85,0.6)]">
      <rect x="4" y="0" width="7" height="1" />
      <rect x="3" y="1" width="9" height="1" />
      <rect x="2" y="2" width="11" height="1" />
      <rect x="2" y="3" width="2" height="1" />
      <rect x="5" y="3" width="5" height="1" />
      <rect x="11" y="3" width="2" height="1" />
      <rect x="0" y="4" width="15" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="5" y="5" width="5" height="1" />
      <rect x="11" y="5" width="2" height="1" />
    </svg>
  );
}

function ShipSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-full h-full'}>
      <rect x="7" y="0" width="2" height="4" fill="#ffffff" />
      <rect x="6" y="4" width="4" height="6" fill="#00ff41" />
      <rect x="4" y="6" width="8" height="4" fill="#00ff41" />
      <rect x="2" y="10" width="12" height="2" fill="#008f11" />
      <rect x="0" y="12" width="4" height="4" fill="#ff0055" />
      <rect x="12" y="12" width="4" height="4" fill="#ff0055" />
      <rect x="7" y="10" width="2" height="6" fill="#00ff41" />
    </svg>
  );
}

function BulletSprite() {
  return (
    <svg width="6" height="16" viewBox="0 0 6 16">
      <rect x="2" y="0" width="2" height="16" fill="#00ff41" />
      <rect x="1" y="0" width="4" height="4" fill="#ffffff" />
    </svg>
  );
}

function CrabSprite({ color = '#00ff41' }: { color?: string }) {
  return (
    <svg width="48" height="32" viewBox="0 0 12 8" fill={color}
      className="drop-shadow-[0_0_6px_rgba(0,255,65,0.5)]">
      <rect x="0" y="2" width="2" height="2" />
      <rect x="2" y="1" width="8" height="1" />
      <rect x="3" y="0" width="6" height="1" />
      <rect x="2" y="2" width="8" height="3" />
      <rect x="3" y="5" width="2" height="1" />
      <rect x="7" y="5" width="2" height="1" />
      <rect x="10" y="2" width="2" height="2" />
      <rect x="4" y="3" width="1" height="1" fill="#050505" />
      <rect x="7" y="3" width="1" height="1" fill="#050505" />
    </svg>
  );
}

// ── pixel progress bar ────────────────────────────────────────────────────────

function PixelBar({ value, max = 100, color = '#00ff41' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-3 bg-white/10 overflow-hidden" style={{ imageRendering: 'pixelated' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}

// ── section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="text-[#ff0055] text-xs">▶</span>
      <span className="text-[#00ff41] text-xs tracking-widest">{label}</span>
      {sub && <span className="text-white/20 text-[8px]">{sub}</span>}
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export function ArcadeTemplate({ profile }: ArcadeTemplateProps) {
  const { sections, user } = profile;

  const name = (user.fullName || 'PLAYER ONE').toUpperCase();
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? 'PLAYER';
  const lastName = nameParts.slice(1).join(' ') || 'ONE';
  // Insert ship between first char and rest of lastName
  const lastHead = lastName[0] ?? '';
  const lastTail = lastName.slice(1);

  const headline = (user.headline || 'FREELANCE DEVELOPER').toUpperCase();
  const about = sections.about || sections.hero?.body || 'No pilot briefing available.';

  const socialLinks = sections.links.filter((l) => l.url.startsWith('http'));
  const contactEmail = (() => {
    const link = sections.links.find(
      (l) => l.kind === 'contact' || l.url.startsWith('mailto:') || l.label.toLowerCase().includes('email'),
    );
    return link?.url.replace('mailto:', '') ?? '';
  })();

  // Score — pad project count to 6 digits
  const scoreRaw = sections.projects.length * 1240 + sections.skills.length * 380 + sections.experience.length * 720;
  const score = String(scoreRaw).padStart(6, '0');

  // Stage — experience count
  const stage = String(sections.experience.length || 1).padStart(2, '0');

  // Scrolling active section
  const [activeSection, setActiveSection] = useState('hero');
  const sections_nav = ['missions', 'weapons', 'deployment', 'intel', 'comms'];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { threshold: 0.3 },
    );
    ['hero', ...sections_nav].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Bullet animation state
  const [bullets, setBullets] = useState<{ id: number; x: number }[]>([]);
  const fireBullet = useCallback(() => {
    const id = Date.now();
    setBullets((b) => [...b, { id, x: Math.random() * 80 + 10 }]);
    setTimeout(() => setBullets((b) => b.filter((bullet) => bullet.id !== id)), 1200);
  }, []);

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{
        background: '#050505',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      {/* Font + keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes move-stars {
          from { transform: translateY(0); }
          to   { transform: translateY(-1000px); }
        }
        @keyframes float-ship {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes blink-txt {
          50% { opacity: 0; }
        }
        @keyframes enemy-wiggle {
          from { transform: translateX(-15px); }
          to   { transform: translateX(15px); }
        }
        @keyframes bullet-rise {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(-120px); opacity: 0; }
        }
        @keyframes scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        .stars-layer {
          background: transparent;
          box-shadow: 240px 10px #FFF,400px 150px #FFF,600px 400px #FFF,800px 100px #FFF,
                      1200px 700px #FFF,100px 800px #FFF,1100px 300px #FFF,300px 550px #FFF,
                      900px 250px #FFF,550px 680px #FFF,1300px 480px #FFF,70px 370px #FFF;
          animation: move-stars 80s linear infinite;
          width: 2px; height: 2px; border-radius: 50%;
        }
        .stars-layer-2 {
          box-shadow: 180px 90px #AAA,450px 200px #DDD,750px 500px #BBB,950px 150px #EEE,
                      1250px 650px #CCC,150px 750px #DDD,350px 450px #AAA;
          animation: move-stars 120s linear infinite;
          opacity: 0.4;
        }
        .scanline-overlay {
          background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.18) 50%),
                      linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04));
          background-size: 100% 4px, 3px 100%;
          pointer-events: none;
        }
        .arcade-blink { animation: blink-txt 1s step-end infinite; }
        .enemy-animate { animation: enemy-wiggle 2s ease-in-out infinite alternate; }
        .ship-float { animation: float-ship 3s ease-in-out infinite; }
        .bullet-animate { animation: bullet-rise 1.2s ease-out forwards; }
        .pixel-border { box-shadow: 0 0 0 2px #00ff41, 0 0 12px rgba(0,255,65,0.2); }
        .pixel-border-red { box-shadow: 0 0 0 2px #ff0055, 0 0 10px rgba(255,0,85,0.2); }
        .glow-green { text-shadow: 0 0 10px rgba(0,255,65,0.6); }
        .glow-red { text-shadow: 0 0 10px rgba(255,0,85,0.6); }
        .glow-amber { text-shadow: 0 0 10px rgba(245,158,11,0.6); }
      `}</style>

      {/* ── Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="stars-layer absolute" />
        <div className="stars-layer stars-layer-2 absolute" style={{ left: '10%' }} />
        <div className="scanline-overlay absolute inset-0 z-50" />
      </div>

      {/* ── Bullet particles ── */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {bullets.map((b) => (
          <div
            key={b.id}
            className="bullet-animate absolute bottom-40"
            style={{ left: `${b.x}%` }}
          >
            <BulletSprite />
          </div>
        ))}
      </div>

      {/* ── HUD Nav ── */}
      <nav className="relative z-40 w-full px-6 py-6 md:px-10 md:py-10 flex justify-between items-start">
        <div className="flex flex-col gap-3">
          <div style={{ color: '#00ff41' }}>SCORE: <span className="text-white">{score}</span></div>
          <div style={{ color: '#ff0055' }}>LIVES: <span className="text-white">❤❤❤</span></div>
        </div>

        <div className="text-center flex flex-col items-center gap-2">
          <div style={{ color: '#f59e0b' }}>STAGE {stage}</div>
          <div className="arcade-blink text-white/60" style={{ fontSize: 8 }}>INSERT COIN</div>
          {/* Nav items */}
          <div className="hidden md:flex gap-4 mt-2">
            {sections_nav.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  fontSize: 8,
                  color: activeSection === id ? '#00ff41' : 'rgba(255,255,255,0.3)',
                  textShadow: activeSection === id ? '0 0 8px rgba(0,255,65,0.6)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                [{id}]
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-3">
          <div className="text-white/40">HI-SCORE: 99999</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>PILOT_ID: {profile.subdomain.toUpperCase()}</div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative z-20 flex flex-col items-center justify-center px-6 py-16 min-h-[80vh]"
      >
        {/* Enemy */}
        <div className="mb-14 enemy-animate">
          <EnemySprite />
        </div>

        {/* Name */}
        <h1
          className="leading-none text-center flex flex-col items-center select-none"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 7rem)' }}
        >
          <span className="glow-green" style={{ color: '#00ff41' }}>{firstName}</span>
          <div className="flex items-center" style={{ marginTop: '-0.1em' }}>
            <span>{lastHead}</span>
            <div
              className="ship-float mx-2 md:mx-4"
              style={{ width: 'clamp(3rem, 8vw, 6rem)', height: 'clamp(3rem, 8vw, 6rem)' }}
            >
              <ShipSprite className="w-full h-full drop-shadow-[0_0_12px_rgba(0,255,65,0.5)]" />
            </div>
            <span>{lastTail}</span>
          </div>
        </h1>

        {/* Headline badge */}
        <div
          className="mt-12 flex items-center gap-4 px-4 py-2"
          style={{
            fontSize: '10px',
            color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)',
            background: 'rgba(245,158,11,0.05)',
          }}
        >
          <span className="opacity-40 animate-pulse">&gt;&gt;</span>
          SECTOR: {headline.replace(/\s+/g, '_')}
          <span className="opacity-40 animate-pulse">&lt;&lt;</span>
        </div>

        {/* Fire button */}
        <button
          type="button"
          onClick={fireBullet}
          className="mt-10 px-6 py-3 transition-all"
          style={{
            fontSize: 9,
            color: '#050505',
            background: '#00ff41',
            boxShadow: '0 0 16px rgba(0,255,65,0.4)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(0,255,65,0.8)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(0,255,65,0.4)'; }}
        >
          ▶ FIRE
        </button>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 arcade-blink"
          style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>
          <span>▼ SCROLL ▼</span>
        </div>
      </section>

      {/* ── MISSIONS (Projects) ── */}
      <section id="missions" className="relative z-20 px-6 md:px-10 py-16">
        <SectionHeader
          label="MISSIONS COMPLETED"
          sub={sections.projects.length > 0 ? `// ${sections.projects.length} LOGGED` : '// AWAITING ORDERS'}
        />
        {sections.projects.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-6 py-16"
            style={{ border: '1px dashed rgba(0,255,65,0.2)', background: 'rgba(0,255,65,0.02)' }}
          >
            <div className="enemy-animate opacity-30">
              <EnemySprite />
            </div>
            <div className="arcade-blink" style={{ fontSize: 9, color: 'rgba(0,255,65,0.5)' }}>
              NO MISSIONS LOGGED
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              ADD PROJECTS TO UNLOCK THIS SECTOR
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sections.projects.map((project, i) => {
              const img = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
              const status = i === 0 ? 'FEATURED' : i % 3 === 0 ? 'CLASSIFIED' : 'COMPLETE';
              const statusColor = status === 'FEATURED' ? '#00ff41' : status === 'CLASSIFIED' ? '#f59e0b' : '#00aaff';
              return (
                <article
                  key={i}
                  className="relative group overflow-hidden transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(0,255,65,0.15)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,65,0.5)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,65,0.15)'; }}
                >
                  <div
                    className="absolute top-2 left-2 px-2 py-1 z-10"
                    style={{ fontSize: 8, background: '#050505', color: statusColor, border: `1px solid ${statusColor}` }}
                  >
                    {status}
                  </div>

                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={project.title} className="w-full aspect-video object-cover opacity-60 group-hover:opacity-80 transition-opacity" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center"
                      style={{ background: 'rgba(0,255,65,0.04)' }}>
                      <CrabSprite color={statusColor} />
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="text-white mb-2" style={{ fontSize: 10 }}>{project.title.toUpperCase()}</h3>
                    {project.description && (
                      <p className="text-white/40 mb-3 leading-relaxed" style={{ fontSize: 8 }}>
                        {project.description.slice(0, 120)}{project.description.length > 120 ? '...' : ''}
                      </p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span key={tag} style={{ fontSize: 8, color: '#00ff41', border: '1px solid rgba(0,255,65,0.3)', padding: '2px 6px' }}>
                            {tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-all"
                        style={{ fontSize: 8, color: '#00ff41' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textShadow = '0 0 8px rgba(0,255,65,0.8)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textShadow = 'none'; }}
                      >
                        [LAUNCH MISSION] →
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── WEAPONS (Skills) ── */}
      <section id="weapons" className="relative z-20 px-6 md:px-10 py-16">
        <SectionHeader
          label="WEAPONS ARRAY"
          sub={sections.skills.length > 0 ? `// ${sections.skills.length} EQUIPPED` : '// UNARMED'}
        />
        {sections.skills.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-6 py-16 max-w-3xl"
            style={{ border: '1px dashed rgba(255,0,85,0.2)', background: 'rgba(255,0,85,0.02)' }}
          >
            <div style={{ fontSize: 32, opacity: 0.25 }}>⚠</div>
            <div className="arcade-blink" style={{ fontSize: 9, color: 'rgba(255,0,85,0.6)' }}>
              WEAPONS OFFLINE
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              ADD SKILLS TO EQUIP YOUR ARSENAL
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              {sections.skills.map((skill, i) => {
                const power = 55 + ((i * 37 + 17) % 46);
                const colors = ['#00ff41', '#00aaff', '#f59e0b', '#ff0055', '#aa00ff'];
                const color = colors[i % colors.length];
                return (
                  <div key={skill} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{skill.toUpperCase()}</span>
                      <span style={{ fontSize: 8, color }}>{power}%</span>
                    </div>
                    <PixelBar value={power} color={color} />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-8 mt-12 opacity-20">
              {[...Array(6)].map((_, i) => (
                <CrabSprite key={i} color={['#00ff41', '#ff0055', '#00aaff'][i % 3]} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── DEPLOYMENT LOG (Experience) ── */}
      {sections.experience.length > 0 && (
        <section id="deployment" className="relative z-20 px-6 md:px-10 py-16">
          <SectionHeader label="DEPLOYMENT LOG" sub={`// ${sections.experience.length} RECORDS`} />
          <div className="relative border-l-2 border-white/10 ml-4 space-y-0">
            {sections.experience.map((exp, i) => (
              <div key={i} className="relative pl-8 pb-10">
                {/* Timeline dot */}
                <div
                  className="absolute -left-[9px] top-0 w-4 h-4 flex items-center justify-center"
                  style={{ background: '#050505' }}
                >
                  <div style={{ width: 6, height: 6, background: '#00ff41', boxShadow: '0 0 6px #00ff41' }} />
                </div>

                <div
                  className="p-4"
                  style={{ background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.12)' }}
                >
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <span className="text-white" style={{ fontSize: 10 }}>{exp.role?.toUpperCase()}</span>
                    {exp.period && (
                      <span style={{ fontSize: 8, color: '#f59e0b' }}>{exp.period.toUpperCase()}</span>
                    )}
                  </div>
                  {exp.company && (
                    <div style={{ fontSize: 8, color: '#00ff41', marginBottom: 8 }}>◈ {exp.company.toUpperCase()}</div>
                  )}
                  {exp.summary && (
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', lineHeight: 1.9 }}>{exp.summary}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── INTEL (About) ── */}
      <section id="intel" className="relative z-20 px-6 md:px-10 py-16">
        <SectionHeader label="PILOT BRIEFING" sub="// CLASSIFIED" />
        <div className="max-w-2xl">
          <div
            className="p-6"
            style={{ background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.15)' }}
          >
            <div className="flex items-start gap-4 mb-4">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={name}
                  className="w-16 h-16 object-cover flex-shrink-0"
                  style={{ imageRendering: 'pixelated', filter: 'grayscale(20%) contrast(1.1)' }}
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-16 h-16 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', fontSize: 14 }}
                >
                  {name.slice(0, 2)}
                </div>
              )}
              <div>
                <div className="text-white mb-1" style={{ fontSize: 10 }}>{name}</div>
                <div style={{ fontSize: 8, color: '#00ff41' }}>{headline}</div>
              </div>
            </div>
            <div
              className="leading-relaxed text-white/50"
              style={{ fontSize: 9, lineHeight: 2.2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}
            >
              &gt; {about}
            </div>
            {sections.certifications && sections.certifications.length > 0 && (
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 8, color: '#f59e0b', marginBottom: 10 }}>CLEARANCES</div>
                <div className="space-y-2">
                  {sections.certifications.map((cert, i) => (
                    <div key={i} style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                      ▸ {(cert.title || 'CERT').toUpperCase()}
                      {cert.issuer && <span style={{ color: 'rgba(255,255,255,0.3)' }}> — {cert.issuer.toUpperCase()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── COMMS (Contact) ── */}
      <section id="comms" className="relative z-20 px-6 md:px-10 py-16">
        <SectionHeader label="OPEN COMMS" sub="// ENCRYPTED" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-4xl">
          <div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 2.2 }}>
              {sections.contact || 'TRANSMISSION CHANNEL OPEN. SEND MESSAGE TO INITIATE CONTACT PROTOCOL.'}
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 mt-5 transition-all"
                style={{ fontSize: 9, color: '#00ff41' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textShadow = '0 0 10px rgba(0,255,65,0.8)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textShadow = 'none'; }}
              >
                ✉ {contactEmail.toUpperCase()}
              </a>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-6 space-y-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 transition-all"
                    style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00ff41'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)'; }}
                  >
                    &gt; [{link.label.toUpperCase()}]
                  </a>
                ))}
              </div>
            )}

            {/* Resume download */}
            {profile.resumeAssetId && (
              <div className="mt-6">
                <ResumeDownloadButton
                  subdomain={subdomain}
                  ownerName={name}
                  label="DOWNLOAD RESUME"
                  style={{
                    fontSize: 9,
                    fontFamily: '"Press Start 2P", monospace',
                    letterSpacing: '0.1em',
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid rgba(0,255,65,0.4)',
                    color: '#00ff41',
                    borderRadius: 0,
                  }}
                  className=""
                />
              </div>
            )}

            {/* System status */}
            <div className="mt-8 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
                ENGINE: <span style={{ color: '#00ff41' }}>NOMINAL</span>
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
                SHIELDS: <span style={{ color: '#00ff41' }}>88%</span>
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
                O2: <span style={{ color: '#00ff41' }}>MAX</span>
              </div>
            </div>
          </div>

          <ContactForm
            recipientEmail={contactEmail}
            theme={{
              formClassName: 'space-y-4',
              labelClassName: 'mb-1.5 block text-[8px] text-[rgba(0,255,65,0.7)] tracking-widest uppercase',
              inputClassName:
                'w-full border border-[rgba(0,255,65,0.2)] bg-[rgba(0,255,65,0.04)] px-3 py-3 text-[9px] text-white outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] font-[inherit] tracking-widest uppercase placeholder:text-white/20 transition-all',
              textareaClassName:
                'w-full border border-[rgba(0,255,65,0.2)] bg-[rgba(0,255,65,0.04)] px-3 py-3 text-[9px] text-white outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] font-[inherit] tracking-widest uppercase placeholder:text-white/20 transition-all',
              buttonClassName:
                'w-full py-3 text-[9px] font-[inherit] tracking-widest uppercase bg-[#00ff41] text-[#050505] transition-all hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] disabled:opacity-60',
              successClassName: 'border border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.06)] p-4 text-[8px] text-[#00ff41] tracking-widest',
              errorClassName: 'mt-1 text-[8px] text-[#ff0055]',
            }}
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-30 w-full px-6 md:px-10 py-10 flex flex-col gap-8"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
      >
        <div
          className="flex flex-col md:flex-row justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex flex-wrap gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="transition-all"
                style={{ color: '#00ff41', fontSize: 9, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 4 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00ff41'; }}
              >
                [{link.label.toUpperCase()}]
              </a>
            ))}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
            PILOT_ID: {profile.subdomain.toUpperCase()}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} {name} SOFT INC.
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>MISSION PROGRESS</div>
            <div className="w-48 h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, sections.projects.length * 14 + 30)}%`,
                  background: '#00ff41',
                  boxShadow: '0 0 8px #00ff41',
                }}
              />
            </div>
          </div>
        </div>
      </footer>

      {/* ── Ambient particles ── */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-30">
        <div className="absolute top-[20%] left-[15%] w-0.5 h-6 bg-[#00ff41] animate-pulse" />
        <div className="absolute bottom-[35%] right-[20%] w-0.5 h-4 bg-[#ff0055]" />
        <div className="absolute top-[50%] right-[10%] w-1 h-1 bg-white" />
        <div className="absolute top-[70%] left-[8%] w-0.5 h-3 bg-[#f59e0b] animate-pulse" />
        <div className="absolute top-[40%] left-[80%] w-0.5 h-5 bg-[#00aaff]" />
      </div>
    </main>
  );
}
