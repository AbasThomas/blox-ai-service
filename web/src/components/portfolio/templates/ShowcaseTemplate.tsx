'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';

interface ShowcaseTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

function ShowcaseAvatar({ url, name, size = 160 }: { url?: string; name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: 'rgba(251,191,36,0.12)',
          border: '2px solid rgba(251,191,36,0.35)',
          borderRadius: 9999,
        }}
        className="flex items-center justify-center text-4xl font-bold text-amber-400"
      >
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size, borderRadius: 9999, border: '3px solid rgba(251,191,36,0.4)' }}
        className="object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <Image
      src={url}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: 9999, border: '3px solid rgba(251,191,36,0.4)' }}
      className="object-cover"
    />
  );
}

function ShowcaseProjectCard({
  project,
  variant = 'normal',
}: {
  project: PublicProfilePayload['sections']['projects'][number];
  variant?: 'tall' | 'wide' | 'normal';
}) {
  const [hovered, setHovered] = useState(false);
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;

  const aspectMap = {
    tall: '3/4',
    wide: '16/9',
    normal: '4/3',
  };

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        aspectRatio: aspectMap[variant],
        background: '#611126',
        cursor: 'default',
      }}
    >
      {imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt={project.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(160deg, #611126, #4A0916)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'rgba(255,228,230,0.2)', fontSize: '0.85rem' }}>No preview</span>
        </div>
      )}

      {/* Bottom overlay — always visible */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(74,9,22,0.95) 0%, transparent 100%)',
          padding: '24px 16px 16px',
          transition: 'opacity 0.3s',
        }}
      >
        {project.tags && project.tags[0] && (
          <span
            style={{
              background: '#FBBF24',
              color: '#4A0916',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '2px 8px',
              borderRadius: 4,
              display: 'inline-block',
              marginBottom: 6,
            }}
          >
            {project.tags[0].toUpperCase()}
          </span>
        )}
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFE4E6', lineHeight: 1.3 }}>
          {project.title}
        </h3>
        {hovered && project.description && (
          <p style={{ color: 'rgba(255,228,230,0.65)', fontSize: '0.75rem', lineHeight: 1.55, marginTop: 6 }}>
            {project.description.slice(0, 80)}{project.description.length > 80 ? '...' : ''}
          </p>
        )}
        {hovered && project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              marginTop: 10,
              background: '#FBBF24',
              color: '#4A0916',
              fontWeight: 700,
              fontSize: '0.72rem',
              padding: '4px 12px',
              borderRadius: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Visit →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function ShowcaseTemplate({ profile, subdomain }: ShowcaseTemplateProps) {
  const { sections, user } = profile;
  const name = user.fullName || 'Portfolio Owner';
  const [active, setActive] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);

  const contactEmail = useMemo(() => {
    const link = sections.links.find(
      (l) => l.kind === 'contact' || l.url.startsWith('mailto:') || l.label.toLowerCase().includes('email'),
    );
    return link?.url.replace('mailto:', '') ?? '';
  }, [sections.links]);

  const socialLinks = sections.links.filter((l) => l.url.startsWith('http'));

  useEffect(() => {
    const ids = ['hero', ...NAV_ITEMS];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { threshold: [0.3, 0.6], rootMargin: '-80px 0px -40% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
    setMobileOpen(false);
  };

  const variants: Array<'tall' | 'wide' | 'normal'> = ['tall', 'normal', 'wide', 'normal', 'tall', 'normal'];

  return (
    <main
      style={{
        background: '#4A0916',
        color: '#FFE4E6',
        fontFamily: '"Inter", system-ui, sans-serif',
        minHeight: '100vh',
      }}
    >
      <SmoothScroll />

      {/* BOLD CRIMSON STICKY NAVBAR */}
      <header
        style={{ background: '#611126', borderBottom: '1px solid rgba(251,191,36,0.15)' }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => scrollTo('hero')}
            style={{ fontWeight: 800, fontSize: '1rem', color: '#FFE4E6', letterSpacing: '-0.01em' }}
          >
            {name.split(' ')[0]}
            <span style={{ color: '#FBBF24' }}>.</span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  position: 'relative',
                  color: active === id ? '#FBBF24' : 'rgba(255,228,230,0.5)',
                  fontWeight: active === id ? 600 : 400,
                  fontSize: '0.82rem',
                  padding: '4px 12px',
                  transition: 'color 0.2s',
                }}
                className="capitalize"
              >
                {id}
                {active === id && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: 12,
                      right: 12,
                      height: 2,
                      background: '#FBBF24',
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                style={{
                  background: '#FBBF24',
                  color: '#4A0916',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
                className="hidden rounded-full px-4 py-1.5 transition hover:bg-amber-300 md:inline-flex"
              >
                Contact
              </a>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              style={{ color: 'rgba(255,228,230,0.5)', fontSize: '0.85rem' }}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? '✕' : '≡'}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            style={{ background: '#611126', borderTop: '1px solid rgba(251,191,36,0.1)', padding: '12px 24px' }}
            className="md:hidden"
          >
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{ color: active === id ? '#FBBF24' : 'rgba(255,228,230,0.4)' }}
                className="block w-full py-2.5 text-left text-sm capitalize"
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO — BOLD DIAGONAL SPLIT */}
      <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }} className="pt-14">
        <div className="mx-auto grid w-full max-w-6xl gap-0 px-6 py-16 lg:grid-cols-[1fr_400px] lg:items-center">
          <div className="space-y-6 py-12">
            <h1
              style={{
                fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                fontWeight: 900,
                lineHeight: 0.95,
                color: '#FFE4E6',
                letterSpacing: '-0.03em',
              }}
            >
              {sections.hero.heading || name}
            </h1>
            {user.headline && (
              <p style={{ color: '#FBBF24', fontWeight: 600, fontSize: '1.1rem' }}>{user.headline}</p>
            )}
            <p style={{ color: 'rgba(255,228,230,0.55)', lineHeight: 1.8, maxWidth: '36rem', fontSize: '0.92rem' }}>
              {sections.hero.body || sections.about || 'Creating bold, memorable digital experiences.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={() => scrollTo('projects')}
                style={{ background: '#FBBF24', color: '#4A0916', fontWeight: 800, fontSize: '0.875rem', borderRadius: 8, padding: '12px 28px' }}
                className="transition hover:bg-amber-300"
              >
                View Work
              </button>
              <button
                type="button"
                onClick={() => scrollTo('contact')}
                style={{
                  border: '2px solid rgba(255,228,230,0.2)',
                  color: 'rgba(255,228,230,0.7)',
                  fontSize: '0.875rem',
                  borderRadius: 8,
                  padding: '10px 24px',
                }}
                className="transition hover:border-rose-300/40 hover:text-rose-200"
              >
                Get In Touch
              </button>
            </div>
            {socialLinks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'rgba(255,228,230,0.3)', fontSize: '0.75rem' }}
                    className="transition hover:text-amber-400"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              background: '#611126',
              borderRadius: 20,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              border: '1px solid rgba(251,191,36,0.12)',
            }}
          >
            <ShowcaseAvatar url={user.avatarUrl} name={name} size={140} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFE4E6' }}>{name}</p>
              {user.headline && (
                <p style={{ color: 'rgba(255,228,230,0.4)', fontSize: '0.8rem', marginTop: 4 }}>{user.headline}</p>
              )}
            </div>
            {sections.skills.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(251,191,36,0.1)', paddingTop: 16, width: '100%' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {sections.skills.slice(0, 8).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        color: '#FBBF24',
                        fontSize: '0.68rem',
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background: '#611126' }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2">
          <div>
            <p style={{ color: '#FBBF24', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 12 }}>
              ABOUT
            </p>
            <h2
              style={{
                fontWeight: 800,
                fontSize: '2.2rem',
                color: '#FFE4E6',
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              The Person Behind the Work
            </h2>
            <p style={{ color: 'rgba(255,228,230,0.55)', lineHeight: 1.85, fontSize: '0.9rem' }}>
              {sections.about || sections.hero.body || 'No biography available yet.'}
            </p>
          </div>

          {sections.experience.length > 0 && (
            <div className="space-y-5">
              {sections.experience.map((exp, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(74,9,22,0.5)',
                    border: '1px solid rgba(251,191,36,0.12)',
                    borderRadius: 12,
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#FFE4E6', fontSize: '0.9rem' }}>{exp.role}</p>
                      {exp.company && (
                        <p style={{ color: '#FBBF24', fontSize: '0.78rem', marginTop: 2 }}>{exp.company}</p>
                      )}
                    </div>
                    {exp.period && (
                      <span style={{ color: 'rgba(255,228,230,0.2)', fontSize: '0.7rem' }}>{exp.period}</span>
                    )}
                  </div>
                  {exp.summary && (
                    <p style={{ color: 'rgba(255,228,230,0.4)', fontSize: '0.8rem', lineHeight: 1.6, marginTop: 8 }}>
                      {exp.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROJECTS — MASONRY GRID */}
      <section id="projects" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <p style={{ color: '#FBBF24', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 6 }}>
                WORK
              </p>
              <h2 style={{ fontWeight: 800, fontSize: '2.2rem', color: '#FFE4E6', lineHeight: 1 }}>
                Projects
              </h2>
            </div>
            <span style={{ color: 'rgba(255,228,230,0.2)', fontSize: '3rem', fontWeight: 900 }}>
              {sections.projects.length.toString().padStart(2, '0')}
            </span>
          </div>

          {sections.projects.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                gridAutoRows: '200px',
              }}
            >
              {sections.projects.map((project, i) => {
                const variant = variants[i % variants.length];
                return (
                  <div
                    key={i}
                    style={{
                      gridRow: variant === 'tall' ? 'span 2' : 'span 1',
                      gridColumn: variant === 'wide' ? 'span 2' : 'span 1',
                    }}
                  >
                    <ShowcaseProjectCard project={project} variant={variant} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{ background: '#611126', border: '1px solid rgba(251,191,36,0.1)', borderRadius: 12, padding: 40, textAlign: 'center' }}
            >
              <p style={{ color: 'rgba(255,228,230,0.2)' }}>No projects added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* SKILLS — SCROLLING TICKER STRIP */}
      <section id="skills" style={{ background: '#611126', overflow: 'hidden' }} className="py-20">
        <div className="mx-auto max-w-6xl px-6 mb-10">
          <p style={{ color: '#FBBF24', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 6 }}>
            SKILLS & TOOLS
          </p>
          <h2 style={{ fontWeight: 800, fontSize: '2.2rem', color: '#FFE4E6', lineHeight: 1 }}>
            What I Work With
          </h2>
        </div>

        {sections.skills.length > 0 ? (
          <div style={{ position: 'relative' }}>
            {/* Gradient masks */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 80,
                background: 'linear-gradient(to right, #611126, transparent)',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 80,
                background: 'linear-gradient(to left, #611126, transparent)',
                zIndex: 2,
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: 12,
                padding: '16px 0',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {[...sections.skills, ...sections.skills].map((skill, i) => (
                <span
                  key={`${skill}-${i}`}
                  style={{
                    background: 'rgba(74,9,22,0.7)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    color: '#FFE4E6',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    padding: '8px 18px',
                    borderRadius: 100,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#FBBF24', marginRight: 6 }}>✦</span>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-6">
            <p style={{ color: 'rgba(255,228,230,0.2)' }}>No skills listed yet.</p>
          </div>
        )}
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ color: '#FBBF24', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 10 }}>
              GET IN TOUCH
            </p>
            <h2
              style={{
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: '#FFE4E6',
                lineHeight: 1.05,
              }}
            >
              Let's Create Something Bold
            </h2>
            <p style={{ color: 'rgba(255,228,230,0.4)', marginTop: 14, fontSize: '0.9rem', maxWidth: '36rem', margin: '14px auto 0' }}>
              {sections.contact || 'Ready to collaborate on your next project? Let\'s talk.'}
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                style={{ color: '#FBBF24', fontWeight: 600, fontSize: '0.875rem', display: 'block', marginTop: 12 }}
                className="transition hover:opacity-80"
              >
                {contactEmail}
              </a>
            )}
          </div>

          <div
            style={{
              background: '#611126',
              border: '1px solid rgba(251,191,36,0.1)',
              borderRadius: 20,
              padding: 36,
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            <ContactForm
              recipientEmail={contactEmail}
              theme={{
                formClassName: 'space-y-4',
                labelClassName: 'mb-1.5 block text-xs font-semibold text-rose-300/60 uppercase tracking-widest',
                inputClassName:
                  'w-full rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100 outline-none focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/10',
                textareaClassName:
                  'w-full rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100 outline-none focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/10',
                buttonClassName:
                  'inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-rose-950 transition hover:bg-amber-300 disabled:opacity-60',
                successClassName:
                  'rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200',
                errorClassName: 'mt-1 text-xs text-rose-300',
              }}
            />
          </div>

          {socialLinks.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 32 }}>
              {socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'rgba(255,228,230,0.3)', fontSize: '0.8rem' }}
                  className="transition hover:text-amber-400"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(251,191,36,0.08)', background: '#611126' }} className="px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p style={{ color: 'rgba(255,228,230,0.2)', fontSize: '0.78rem' }}>
            © {new Date().getFullYear()} {name}
          </p>
          <p style={{ color: '#FBBF24', fontWeight: 700, fontSize: '0.75rem' }}>
            {name.split(' ')[0]}<span style={{ color: 'rgba(255,228,230,0.2)' }}>.</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
