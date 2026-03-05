'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';
import { getSkillIconData } from './shared/SkillBadge';

interface GlassDevTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

const GLASS = {
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(99,102,241,0.18)',
  cardHover: 'rgba(255,255,255,0.07)',
  accent: '#6366f1',
  accentLight: '#818cf8',
  text: '#e2e8f0',
  muted: '#64748b',
  dim: '#334155',
};

function GlassCard({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      style={{
        background: GLASS.card,
        border: `1px solid ${GLASS.cardBorder}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function GlassAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div style={{ width: 140, height: 140, background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)' }} className="flex items-center justify-center rounded-full text-4xl font-bold text-indigo-400">
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 140, height: 140 }} className="rounded-full object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={140} height={140} className="rounded-full object-cover" />;
}

function GlassProjectCard({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const [hovered, setHovered] = useState(false);
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? GLASS.cardHover : GLASS.card,
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.4)' : GLASS.cardBorder}`,
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all 0.25s',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)', transition: 'filter 0.3s' }} loading="lazy" className={hovered ? 'brightness-95' : ''} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }} className="flex items-center justify-center">
            <span style={{ color: '#1e1b4b', fontSize: '0.82rem' }}>No preview</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,20,0.6) 0%, transparent 60%)' }} />
      </div>
      <div style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: GLASS.text, marginBottom: 6 }}>{project.title}</h3>
        {project.description && <p style={{ color: GLASS.muted, fontSize: '0.82rem', lineHeight: 1.65 }}>{project.description}</p>}
        {project.tags && project.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {project.tags.map((tag) => (
              <span key={tag} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: GLASS.accentLight, fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, color: GLASS.accentLight, fontSize: '0.78rem', fontWeight: 600 }} className="transition hover:text-indigo-300">
            View project →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function GlassDevTemplate({ profile, subdomain }: GlassDevTemplateProps) {
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
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
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

  return (
    <main style={{ background: '#060614', color: GLASS.text, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh', position: 'relative' }}>
      <SmoothScroll />
      {/* Background orbs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', paddingTop: '40%', borderRadius: 9999, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '-5%', width: '35%', paddingTop: '35%', borderRadius: 9999, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '60%', left: '30%', width: '30%', paddingTop: '30%', borderRadius: 9999, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* FULL-WIDTH GLASS NAVBAR */}
      <header
        style={{ background: 'rgba(6,6,20,0.7)', backdropFilter: 'blur(24px)', borderBottom: `1px solid ${GLASS.cardBorder}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button type="button" onClick={() => scrollTo('hero')} style={{ fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {name}
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  background: active === id ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: active === id ? '#818cf8' : '#475569',
                  border: `1px solid ${active === id ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                  fontSize: '0.82rem',
                  padding: '5px 14px',
                  borderRadius: 8,
                  backdropFilter: active === id ? 'blur(8px)' : 'none',
                  transition: 'all 0.2s',
                }}
                className="capitalize"
              >
                {id}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scrollTo('contact')} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, padding: '6px 16px', borderRadius: 8, backdropFilter: 'blur(8px)' }} className="hidden transition hover:bg-indigo-500/20 md:inline-flex">
              Hire Me
            </button>
            <button type="button" onClick={() => setMobileOpen((p) => !p)} style={{ color: '#475569' }} className="md:hidden" aria-label="Toggle menu">
              {mobileOpen ? '✕' : '≡'}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ background: 'rgba(6,6,20,0.95)', borderTop: `1px solid ${GLASS.cardBorder}`, padding: '12px 24px' }} className="md:hidden">
            {NAV_ITEMS.map((id) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} style={{ color: active === id ? '#818cf8' : '#475569' }} className="block w-full py-2.5 text-left text-sm capitalize">
                {id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO — CENTERED WITH GLASS STAT CARDS */}
      <section id="hero" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px 64px', textAlign: 'center' }}>
        {/* Avatar with concentric glass rings */}
        <div style={{ position: 'relative', marginBottom: 28, display: 'inline-flex' }}>
          <div style={{ position: 'absolute', inset: -16, borderRadius: 9999, border: '1px solid rgba(99,102,241,0.12)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', inset: -32, borderRadius: 9999, border: '1px solid rgba(99,102,241,0.06)' }} />
          <GlassAvatar url={user.avatarUrl} name={name} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ color: GLASS.muted, fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: 10 }}>{subdomain}.blox.app</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, color: GLASS.text, maxWidth: '40rem', margin: '0 auto' }}>
            {sections.hero.heading || name}
          </h1>
          {user.headline && <p style={{ color: GLASS.accentLight, fontWeight: 500, fontSize: '1.05rem', marginTop: 10 }}>{user.headline}</p>}
          <p style={{ color: GLASS.muted, lineHeight: 1.8, maxWidth: '36rem', margin: '14px auto 0', fontSize: '0.9rem' }}>
            {sections.hero.body || sections.about || 'Building robust software solutions with modern technologies.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          <button type="button" onClick={() => scrollTo('projects')} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', fontWeight: 700, fontSize: '0.875rem', padding: '10px 26px', borderRadius: 10, backdropFilter: 'blur(8px)' }} className="transition hover:bg-indigo-500/30">
            Projects
          </button>
          <button type="button" onClick={() => scrollTo('contact')} style={{ background: GLASS.card, border: `1px solid ${GLASS.cardBorder}`, color: GLASS.muted, fontSize: '0.875rem', padding: '10px 24px', borderRadius: 10, backdropFilter: 'blur(8px)' }} className="transition hover:text-indigo-400">
            Contact
          </button>
        </div>

        {/* Floating glass stat cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {[
            { label: 'Projects', value: sections.projects.length },
            { label: 'Skills', value: sections.skills.length },
            { label: 'Roles', value: sections.experience.length },
          ].filter((s) => s.value > 0).map((stat) => (
            <GlassCard key={stat.label} style={{ padding: '14px 22px', textAlign: 'center', minWidth: 90 }}>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: GLASS.accentLight }}>{stat.value}+</p>
              <p style={{ fontSize: '0.72rem', color: GLASS.muted }}>{stat.label}</p>
            </GlassCard>
          ))}
          {socialLinks.map((link) => (
            <GlassCard key={link.url} style={{ padding: '12px 18px' }}>
              <a href={link.url} target="_blank" rel="noreferrer" style={{ color: GLASS.muted, fontSize: '0.78rem' }} className="transition hover:text-indigo-400">
                {link.label} →
              </a>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ position: 'relative', zIndex: 1 }} className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 style={{ fontWeight: 700, fontSize: '1.6rem', marginBottom: 28, color: GLASS.text }}>About</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <GlassCard style={{ padding: 24 }}>
              <p style={{ color: GLASS.muted, lineHeight: 1.85, fontSize: '0.9rem' }}>
                {sections.about || sections.hero.body || 'No biography available yet.'}
              </p>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} style={{ color: GLASS.accentLight, fontWeight: 600, fontSize: '0.83rem', display: 'block', marginTop: 16 }} className="transition hover:text-indigo-300">
                  {contactEmail}
                </a>
              )}
            </GlassCard>
            {sections.experience.length > 0 && (
              <div className="space-y-3">
                {sections.experience.map((exp, i) => (
                  <GlassCard key={i} style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: GLASS.text }}>{exp.role}</p>
                        {exp.company && <p style={{ color: GLASS.accentLight, fontSize: '0.78rem', marginTop: 2 }}>{exp.company}</p>}
                      </div>
                      {exp.period && <span style={{ color: GLASS.dim, fontSize: '0.7rem' }}>{exp.period}</span>}
                    </div>
                    {exp.summary && <p style={{ color: GLASS.muted, fontSize: '0.8rem', lineHeight: 1.6, marginTop: 8 }}>{exp.summary}</p>}
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROJECTS — GLASS CARDS */}
      <section id="projects" style={{ position: 'relative', zIndex: 1 }} className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 style={{ fontWeight: 700, fontSize: '1.6rem', marginBottom: 28, color: GLASS.text }}>Projects</h2>
          {sections.projects.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {sections.projects.map((project, i) => (
                <GlassProjectCard key={i} project={project} />
              ))}
            </div>
          ) : (
            <GlassCard style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: GLASS.dim }}>No projects added yet.</p>
            </GlassCard>
          )}
        </div>
      </section>

      {/* SKILLS — CATEGORISED GLASS GROUPS */}
      <section id="skills" style={{ position: 'relative', zIndex: 1 }} className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 style={{ fontWeight: 700, fontSize: '1.6rem', marginBottom: 28, color: GLASS.text }}>Skills</h2>
          {sections.skills.length > 0 ? (
            <GlassCard style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {sections.skills.map((skill) => {
                  const { icon: Icon, colorClass, hex } = getSkillIconData(skill);
                  return (
                    <div
                      key={skill}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        padding: '7px 12px',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Icon className={`h-4 w-4 ${colorClass}`} aria-hidden />
                      <span style={{ color: GLASS.text, fontSize: '0.82rem' }}>{skill}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ) : (
            <GlassCard style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ color: GLASS.dim }}>No skills listed yet.</p>
            </GlassCard>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ position: 'relative', zIndex: 1 }} className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 style={{ fontWeight: 700, fontSize: '1.6rem', marginBottom: 28, color: GLASS.text }}>Contact</h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <GlassCard style={{ padding: 24 }}>
              <p style={{ fontWeight: 700, fontSize: '1.2rem', color: GLASS.text, marginBottom: 10 }}>Let's connect</p>
              <p style={{ color: GLASS.muted, lineHeight: 1.75, fontSize: '0.88rem' }}>
                {sections.contact || 'Available for freelance projects and full-time opportunities.'}
              </p>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} style={{ color: GLASS.accentLight, fontWeight: 600, fontSize: '0.82rem', display: 'block', marginTop: 14 }}>
                  {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                  {socialLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: GLASS.dim, fontSize: '0.75rem', border: `1px solid ${GLASS.cardBorder}`, borderRadius: 20, padding: '3px 10px' }} className="transition hover:text-indigo-400">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </GlassCard>
            <GlassCard style={{ padding: 24 }}>
              <ContactForm
                recipientEmail={contactEmail}
                theme={{
                  labelClassName: 'mb-1.5 block text-xs font-medium text-indigo-800',
                  inputClassName: 'w-full rounded-xl border border-indigo-900/40 bg-indigo-950/30 px-3 py-2.5 text-sm text-indigo-100 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 backdrop-blur',
                  textareaClassName: 'w-full rounded-xl border border-indigo-900/40 bg-indigo-950/30 px-3 py-2.5 text-sm text-indigo-100 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 backdrop-blur',
                  buttonClassName: 'inline-flex w-full items-center justify-center rounded-xl bg-indigo-600/80 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500/80 disabled:opacity-60 backdrop-blur',
                  successClassName: 'rounded-xl border border-indigo-500/20 bg-indigo-950/40 p-4 text-sm text-indigo-300',
                  errorClassName: 'mt-1 text-xs text-rose-400',
                }}
              />
            </GlassCard>
          </div>
        </div>
      </section>

      <footer style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${GLASS.cardBorder}` }} className="px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p style={{ color: '#1e2a4a', fontSize: '0.78rem' }}>© {new Date().getFullYear()} {name}</p>
          <p style={{ color: GLASS.accentLight, fontSize: '0.72rem' }}>{subdomain}.blox.app</p>
        </div>
      </footer>
    </main>
  );
}
