'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';

interface GardenStudioTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

// ── pixel flower sprites ──────────────────────────────────────────────────────

function FlowerLarge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className ?? 'w-full h-full'}>
      <rect x="11" y="20" width="2" height="12" fill="#166534" />
      <rect x="4" y="8" width="16" height="12" fill="#db2777" />
      <rect x="8" y="4" width="8" height="16" fill="#ec4899" />
      <rect x="10" y="10" width="4" height="4" fill="#fdf2f8" />
      <rect x="6" y="12" width="2" height="4" fill="#9d174d" />
      <rect x="16" y="12" width="2" height="4" fill="#9d174d" />
    </svg>
  );
}

function FlowerNav() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <rect x="10" y="16" width="4" height="8" fill="#166534" />
      <rect x="6" y="8" width="12" height="8" fill="#ec4899" />
      <rect x="10" y="4" width="4" height="4" fill="#fbcfe8" />
      <rect x="10" y="10" width="4" height="4" fill="#9d174d" />
    </svg>
  );
}

function FlowerSmallA() {
  return (
    <svg viewBox="0 0 16 20">
      <rect x="4" y="4" width="8" height="8" fill="#ec4899" />
      <rect x="7" y="12" width="2" height="8" fill="#166534" />
    </svg>
  );
}

function FlowerSmallB() {
  return (
    <svg viewBox="0 0 16 20">
      <rect x="4" y="4" width="8" height="8" fill="#db2777" />
      <rect x="7" y="12" width="2" height="8" fill="#14532d" />
    </svg>
  );
}

function FlowerTiny({ color = '#ec4899' }: { color?: string }) {
  return (
    <svg viewBox="0 0 12 16" className="w-full h-full">
      <rect x="5" y="8" width="2" height="8" fill="#166534" />
      <rect x="3" y="3" width="6" height="6" fill={color} />
      <rect x="5" y="5" width="2" height="2" fill="#fdf2f8" />
    </svg>
  );
}

// ── section divider ───────────────────────────────────────────────────────────

function GardenDivider() {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(236,72,153,0.2)' }} />
      <div className="w-4 h-5 pixel-art opacity-60">
        <FlowerSmallA />
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(236,72,153,0.2)' }} />
    </div>
  );
}

// ── project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: PublicProfilePayload['sections']['projects'][number]; index: number }) {
  const img = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  const flowerColors = ['#ec4899', '#db2777', '#f472b6', '#be185d', '#f9a8d4'];
  const fc = flowerColors[index % flowerColors.length];

  return (
    <article
      className="group relative overflow-hidden transition-all duration-500"
      style={{
        background: 'rgba(236,72,153,0.04)',
        border: '1px solid rgba(236,72,153,0.15)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236,72,153,0.45)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236,72,153,0.15)'; }}
    >
      {/* image or placeholder */}
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={project.title}
          className="w-full aspect-video object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
          loading="lazy"
          style={{ filter: 'saturate(0.8)' }}
        />
      ) : (
        <div
          className="w-full aspect-video flex items-center justify-center"
          style={{ background: 'rgba(236,72,153,0.06)' }}
        >
          <div className="w-10 h-12 pixel-art animate-bloom opacity-40">
            <FlowerTiny color={fc} />
          </div>
        </div>
      )}

      {/* corner flower */}
      <div className="absolute top-3 right-3 w-4 h-5 pixel-art opacity-0 group-hover:opacity-70 transition-opacity duration-300">
        <FlowerTiny color={fc} />
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-2">
          {project.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 9,
                fontFamily: '"Space Mono", monospace',
                color: '#ec4899',
                border: '1px solid rgba(236,72,153,0.3)',
                padding: '2px 8px',
                letterSpacing: '0.15em',
              }}
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
        <h3
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: '1.3rem',
            color: '#f8fafc',
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {project.title}
        </h3>
        {project.description && (
          <p style={{ fontSize: 11, color: 'rgba(248,250,252,0.5)', lineHeight: 1.85, fontFamily: '"Space Mono", monospace' }}>
            {project.description.slice(0, 140)}{project.description.length > 140 ? '...' : ''}
          </p>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              marginTop: 14,
              fontSize: 10,
              fontFamily: '"Space Mono", monospace',
              letterSpacing: '0.2em',
              color: '#ec4899',
            }}
            className="transition-opacity hover:opacity-70"
          >
            VIEW WORK →
          </a>
        )}
      </div>
    </article>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export function GardenStudioTemplate({ profile }: GardenStudioTemplateProps) {
  const { sections, user } = profile;

  const name = user.fullName || 'Designer';
  const words = name.trim().split(/\s+/);
  // Hero name split: line1 = all but last word, line2 = last word with flower inside
  const line1 = words.length > 1 ? words.slice(0, -1).join(' ') : name.slice(0, Math.ceil(name.length / 2));
  const line2raw = words.length > 1 ? words[words.length - 1] : name.slice(Math.ceil(name.length / 2));
  const line2head = line2raw.slice(0, 1);
  const line2tail = line2raw.slice(1);

  const headline = user.headline || 'Creative Designer';
  const about = sections.about || sections.hero?.body || '';

  const socialLinks = sections.links.filter((l) => l.url.startsWith('http'));
  const contactEmail = (() => {
    const link = sections.links.find(
      (l) => l.kind === 'contact' || l.url.startsWith('mailto:') || l.label.toLowerCase().includes('email'),
    );
    return link?.url.replace('mailto:', '') ?? '';
  })();

  // Nav scroll active
  const navItems = ['works', 'about', 'skills', 'contact'];
  const [active, setActive] = useState('hero');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { threshold: 0.3 },
    );
    ['hero', ...navItems].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#051a1a',
        color: '#f8fafc',
        fontFamily: '"Space Mono", monospace',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Space+Mono:wght@400;700&display=swap');

        .gs-font-serif {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 400;
        }
        .gs-bg-grid {
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(236,72,153,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(236,72,153,0.05) 1px, transparent 1px);
        }
        .pixel-art { image-rendering: pixelated; }

        @keyframes gs-bloom {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes gs-sway {
          0%, 100% { transform: rotate(-3deg); }
          50%       { transform: rotate(3deg); }
        }
        @keyframes gs-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-bloom  { animation: gs-bloom 5s ease-in-out infinite; }
        .animate-sway   { animation: gs-sway 3s ease-in-out infinite; }
        .gs-fadein      { animation: gs-fadein 0.7s ease forwards; }

        ::selection { background: #ec4899; color: #fff; }
      `}</style>

      {/* Grid bg */}
      <div className="gs-bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* Ambient floating flowers */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute top-[15%] right-[15%] w-6 h-8 pixel-art animate-bloom" style={{ animationDelay: '-1s' }}>
          <FlowerSmallA />
        </div>
        <div className="absolute bottom-[25%] left-[10%] w-8 h-10 pixel-art animate-bloom" style={{ animationDelay: '-2.5s' }}>
          <FlowerSmallB />
        </div>
        <div className="absolute top-[60%] right-[8%] w-5 h-6 pixel-art animate-bloom" style={{ animationDelay: '-4s' }}>
          <FlowerTiny color="#f472b6" />
        </div>
        <div className="absolute top-[35%] left-[5%] w-4 h-5 pixel-art animate-bloom" style={{ animationDelay: '-0.5s' }}>
          <FlowerTiny color="#db2777" />
        </div>
      </div>

      {/* ── Nav ── */}
      <nav
        className="relative z-50 w-full px-8 py-8 flex justify-between items-center"
        style={{ position: 'sticky', top: 0, backdropFilter: 'blur(12px)', background: 'rgba(5,26,26,0.7)' }}
      >
        <button type="button" onClick={() => scrollTo('hero')} className="w-10 h-10 pixel-art animate-sway">
          <FlowerNav />
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              style={{
                fontSize: 10,
                letterSpacing: '0.25em',
                fontFamily: '"Space Mono", monospace',
                color: active === id ? '#ec4899' : 'rgba(248,250,252,0.45)',
                transition: 'color 0.2s',
                textTransform: 'uppercase',
              }}
            >
              {id}
            </button>
          ))}
        </div>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          className="group flex flex-col gap-1.5 p-2"
          aria-label="Menu"
        >
          <div
            className="h-0.5 transition-all"
            style={{ width: menuOpen ? 16 : 32, background: '#f472b6' }}
          />
          <div className="w-8 h-0.5" style={{ background: '#f8fafc' }} />
          <div
            className="h-0.5 self-end transition-all"
            style={{ width: menuOpen ? 32 : 16, background: '#f472b6' }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="relative z-50 flex flex-col items-center gap-5 py-6 md:hidden"
          style={{ background: 'rgba(5,26,26,0.95)', borderBottom: '1px solid rgba(236,72,153,0.2)' }}
        >
          {navItems.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              style={{ fontSize: 10, letterSpacing: '0.3em', color: active === id ? '#ec4899' : 'rgba(248,250,252,0.5)', textTransform: 'uppercase' }}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative z-20 flex flex-col items-center justify-center px-6 text-center"
        style={{ minHeight: '85vh' }}
      >
        {/* Headline label */}
        <div
          style={{
            marginBottom: 24,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.4em',
            color: '#ec4899',
            textTransform: 'uppercase',
            fontFamily: '"Space Mono", monospace',
          }}
        >
          {headline}
        </div>

        {/* Big serif name */}
        <h1
          className="gs-font-serif leading-[0.85] tracking-tighter flex flex-col items-center"
          style={{ fontSize: 'clamp(4rem, 22vw, 15rem)', color: '#f8fafc' }}
        >
          <span>{line1.toLowerCase()}</span>
          <span className="flex items-center" style={{ marginTop: '-0.05em' }}>
            {line2head.toLowerCase()}
            <div
              className="pixel-art animate-bloom mx-1 md:mx-2 self-center"
              style={{
                width: 'clamp(2rem, 8vw, 6rem)',
                height: 'clamp(2.5rem, 10vw, 7.5rem)',
                transform: 'translateY(10%)',
                filter: 'drop-shadow(0 0 15px rgba(236,72,153,0.3))',
              }}
            >
              <FlowerLarge />
            </div>
            {line2tail.toLowerCase()}
          </span>
        </h1>

        {/* Location badge */}
        {user.headline && (
          <div
            className="mt-8 px-4 py-1"
            style={{
              border: '1px solid rgba(236,72,153,0.3)',
              borderRadius: 9999,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: '#f472b6',
              textTransform: 'uppercase',
              background: 'rgba(131,24,67,0.1)',
              backdropFilter: 'blur(4px)',
              fontFamily: '"Space Mono", monospace',
            }}
          >
            {user.headline}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-4 mt-10 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => scrollTo('works')}
            style={{
              fontSize: 10,
              letterSpacing: '0.25em',
              padding: '12px 28px',
              background: '#ec4899',
              color: '#fff',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#db2777'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ec4899'; }}
          >
            VIEW WORKS
          </button>
          <button
            type="button"
            onClick={() => scrollTo('contact')}
            style={{
              fontSize: 10,
              letterSpacing: '0.25em',
              padding: '12px 28px',
              border: '1px solid rgba(236,72,153,0.4)',
              color: '#f472b6',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ec4899'; (e.currentTarget as HTMLButtonElement).style.color = '#ec4899'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#f472b6'; }}
          >
            GET IN TOUCH
          </button>
        </div>
      </section>

      {/* ── WORKS (Projects) ── */}
      <section id="works" className="relative z-20 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="gs-font-serif" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', color: '#f8fafc' }}>
              Selected Works
            </h2>
            <span style={{ fontSize: 10, color: 'rgba(248,250,252,0.3)', letterSpacing: '0.2em' }}>
              {sections.projects.length > 0 ? `${sections.projects.length} PROJECTS` : 'NO PROJECTS YET'}
            </span>
          </div>

          <GardenDivider />

          {sections.projects.length === 0 ? (
            <div
              className="flex flex-col items-center gap-6 py-20"
              style={{ border: '1px dashed rgba(236,72,153,0.2)' }}
            >
              <div className="w-12 h-14 pixel-art animate-bloom opacity-40">
                <FlowerLarge />
              </div>
              <p style={{ fontSize: 10, color: 'rgba(248,250,252,0.3)', letterSpacing: '0.2em' }}>
                NO WORKS ADDED YET
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sections.projects.map((project, i) => (
                <ProjectCard key={i} project={project} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="relative z-20 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="gs-font-serif mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#f8fafc' }}>
              About Me
            </h2>
            <GardenDivider />
            <p
              className="mt-8"
              style={{ fontSize: 12, color: 'rgba(248,250,252,0.6)', lineHeight: 2.2, fontFamily: '"Space Mono", monospace' }}
            >
              {about || 'No biography available yet.'}
            </p>

            {/* Avatar */}
            {user.avatarUrl && (
              <div className="mt-8 w-32 h-32 overflow-hidden" style={{ border: '1px solid rgba(236,72,153,0.3)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" style={{ filter: 'saturate(0.8)' }} loading="lazy" />
              </div>
            )}
          </div>

          {/* Experience */}
          {sections.experience.length > 0 && (
            <div>
              <h3
                style={{ fontSize: 10, letterSpacing: '0.3em', color: '#ec4899', marginBottom: 24, textTransform: 'uppercase' }}
              >
                Experience
              </h3>
              <div className="space-y-6">
                {sections.experience.map((exp, i) => (
                  <div
                    key={i}
                    className="relative pl-5"
                    style={{ borderLeft: '1px solid rgba(236,72,153,0.25)', paddingBottom: 20 }}
                  >
                    {/* dot */}
                    <div
                      className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full"
                      style={{ background: '#ec4899', boxShadow: '0 0 8px rgba(236,72,153,0.6)' }}
                    />
                    <div className="flex flex-wrap justify-between gap-1 mb-1">
                      <span style={{ fontSize: 11, color: '#f8fafc', fontFamily: '"Space Mono", monospace' }}>
                        {exp.role}
                      </span>
                      {exp.period && (
                        <span style={{ fontSize: 9, color: '#ec4899', letterSpacing: '0.15em' }}>{exp.period}</span>
                      )}
                    </div>
                    {exp.company && (
                      <div style={{ fontSize: 10, color: 'rgba(248,250,252,0.4)', marginBottom: 4 }}>{exp.company}</div>
                    )}
                    {exp.summary && (
                      <p style={{ fontSize: 10, color: 'rgba(248,250,252,0.35)', lineHeight: 1.9 }}>{exp.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="skills" className="relative z-20 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="gs-font-serif mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#f8fafc' }}>
            Toolkit
          </h2>
          <GardenDivider />

          {sections.skills.length === 0 ? (
            <div
              className="flex flex-col items-center gap-4 py-16 mt-8"
              style={{ border: '1px dashed rgba(236,72,153,0.2)' }}
            >
              <div className="w-8 h-10 pixel-art animate-bloom opacity-30">
                <FlowerTiny color="#ec4899" />
              </div>
              <p style={{ fontSize: 10, color: 'rgba(248,250,252,0.3)', letterSpacing: '0.2em' }}>NO SKILLS ADDED YET</p>
            </div>
          ) : (
            <div className="mt-10 flex flex-wrap gap-3">
              {sections.skills.map((skill, i) => {
                const hues = [
                  { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.35)', text: '#f472b6' },
                  { bg: 'rgba(219,39,119,0.1)', border: 'rgba(219,39,119,0.35)', text: '#ec4899' },
                  { bg: 'rgba(157,23,77,0.15)', border: 'rgba(157,23,77,0.4)', text: '#f9a8d4' },
                ];
                const h = hues[i % hues.length];
                return (
                  <div
                    key={skill}
                    className="flex items-center gap-2 px-4 py-2.5 transition-all"
                    style={{ background: h.bg, border: `1px solid ${h.border}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(236,72,153,0.18)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = h.bg; }}
                  >
                    <div className="w-3 h-4 pixel-art opacity-70 flex-shrink-0">
                      <FlowerTiny color={h.text} />
                    </div>
                    <span style={{ fontSize: 10, letterSpacing: '0.2em', color: h.text, fontFamily: '"Space Mono", monospace' }}>
                      {skill.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Certifications */}
          {sections.certifications && sections.certifications.length > 0 && (
            <div className="mt-14">
              <h3 style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(248,250,252,0.35)', marginBottom: 16 }}>
                CERTIFICATIONS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.certifications.map((cert, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ border: '1px solid rgba(236,72,153,0.15)', background: 'rgba(236,72,153,0.03)' }}
                  >
                    <div className="w-3 h-4 pixel-art flex-shrink-0 opacity-60">
                      <FlowerTiny color="#ec4899" />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#f8fafc' }}>{cert.title}</div>
                      {cert.issuer && (
                        <div style={{ fontSize: 9, color: 'rgba(248,250,252,0.35)', marginTop: 2 }}>{cert.issuer}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="relative z-20 px-6 md:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="gs-font-serif mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#f8fafc' }}>
            Let's Grow Together
          </h2>
          <GardenDivider />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p style={{ fontSize: 11, color: 'rgba(248,250,252,0.5)', lineHeight: 2.2, fontFamily: '"Space Mono", monospace' }}>
                {sections.contact || 'Open to creative collaborations, commissions and conversations. Reach out anytime.'}
              </p>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  style={{ display: 'block', marginTop: 20, fontSize: 10, letterSpacing: '0.2em', color: '#ec4899' }}
                  className="transition-opacity hover:opacity-70"
                >
                  ✉ {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-8 space-y-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 transition-all"
                      style={{ fontSize: 10, color: 'rgba(248,250,252,0.35)', letterSpacing: '0.2em' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ec4899'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(248,250,252,0.35)'; }}
                    >
                      <div className="w-3 h-4 pixel-art opacity-0 group-hover:opacity-70 transition-opacity">
                        <FlowerTiny color="#ec4899" />
                      </div>
                      {link.label.toUpperCase()} →
                    </a>
                  ))}
                </div>
              )}
            </div>

            {profile.resumeAssetId && (
              <div className="mb-6">
                <ResumeDownloadButton
                  subdomain={profile.subdomain}
                  ownerName={name}
                  className="inline-flex items-center gap-2 px-5 py-3 text-[10px] font-bold tracking-[0.25em] uppercase border border-pink-500/40 text-pink-300 transition hover:border-pink-500 hover:text-pink-200"
                  style={{ fontFamily: '"Space Mono", monospace' }}
                />
              </div>
            )}

            <ContactForm
              recipientEmail={contactEmail}
              theme={{
                formClassName: 'space-y-4',
                labelClassName: 'mb-1.5 block text-[9px] font-bold tracking-[0.25em] text-pink-400/70 uppercase font-mono',
                inputClassName:
                  'w-full border border-pink-500/20 bg-pink-950/10 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-pink-500/50 focus:shadow-[0_0_12px_rgba(236,72,153,0.15)] font-mono tracking-wider placeholder:text-white/20 transition-all',
                textareaClassName:
                  'w-full border border-pink-500/20 bg-pink-950/10 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-pink-500/50 focus:shadow-[0_0_12px_rgba(236,72,153,0.15)] font-mono tracking-wider placeholder:text-white/20 transition-all',
                buttonClassName:
                  'w-full py-3 text-[10px] font-bold tracking-[0.25em] uppercase font-mono bg-pink-500 text-white transition-all hover:bg-pink-600 disabled:opacity-60',
                successClassName: 'border border-pink-500/30 bg-pink-950/20 p-4 text-[10px] text-pink-300 tracking-widest font-mono',
                errorClassName: 'mt-1 text-[9px] text-rose-400 font-mono',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-30 w-full px-8 py-8 flex flex-col gap-6"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(253,242,248,0.5)', textTransform: 'uppercase' }}
      >
        <div
          className="flex justify-between flex-wrap gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(236,72,153,0.2)' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Available for Collaboration
          </span>
          <span style={{ color: 'rgba(248,250,252,0.3)' }}>{new Date().getFullYear()}</span>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-6 flex-wrap">
            {socialLinks.length > 0
              ? socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors"
                    style={{ color: 'rgba(248,250,252,0.4)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ec4899'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(248,250,252,0.4)'; }}
                  >
                    {link.label}
                  </a>
                ))
              : null}
          </div>
          <div style={{ color: 'rgba(248,250,252,0.3)' }}>
            {name} © Garden Studio
          </div>
        </div>
      </footer>
    </div>
  );
}
