'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';
import { SmoothScroll } from './shared/SmoothScroll';
import { SkillBadge, detectSkillPersona } from './shared/SkillBadge';
import { FadeIn, FadeInGroup, FadeInItem } from './shared/FadeIn';
import { ExperienceTimeline } from './shared/ExperienceTimeline';

interface NightfallTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

function NightfallAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div
        style={{ width: 128, height: 128, background: 'rgba(30,206,250,0.08)', border: '2px solid rgba(30,206,250,0.3)' }}
        className="flex items-center justify-center rounded-full text-3xl font-bold text-cyan-300"
      >
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 128, height: 128 }} className="rounded-full object-cover" loading="lazy" />
    );
  }
  return (
    <Image src={url} alt={name} width={128} height={128} className="rounded-full object-cover" />
  );
}

function NightfallProjectCard({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;

  return (
    <motion.article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={reduced ? {} : { y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
      style={{
        background: 'rgba(19,26,35,0.9)',
        border: `1px solid ${hovered ? 'rgba(30,206,250,0.4)' : 'rgba(30,206,250,0.1)'}`,
        transition: 'border-color 0.25s',
      }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-video overflow-hidden">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            style={{ background: 'linear-gradient(135deg, rgba(30,206,250,0.08), rgba(99,102,241,0.08))' }}
            className="flex h-full w-full items-center justify-center"
          >
            <span style={{ color: '#334155', fontSize: '0.85rem' }}>No preview available</span>
          </div>
        )}
        {hovered && project.url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ background: 'rgba(12,15,19,0.88)', backdropFilter: 'blur(6px)' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#1ECEFA', color: '#0C0F13', fontWeight: 700 }}
              className="rounded-full px-6 py-2 text-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Visit Project →
            </a>
          </motion.div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#E2E8F0' }}>{project.title}</h3>
        {project.description && (
          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.65 }}>{project.description}</p>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: 'rgba(30,206,250,0.07)',
                  border: '1px solid rgba(30,206,250,0.2)',
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                }}
                className="rounded-full px-2.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {project.url && !hovered && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#1ECEFA', fontSize: '0.8rem', fontWeight: 600 }}
            className="inline-block transition hover:opacity-80"
          >
            View project →
          </a>
        )}
      </div>
    </motion.article>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function NightfallTemplate({ profile, subdomain }: NightfallTemplateProps) {
  const { sections, user } = profile;
  const name = user.fullName || 'Portfolio Owner';
  const skillPersona = detectSkillPersona(sections.skills);
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

  return (
    <main
      style={{
        background: '#0C0F13',
        color: '#E2E8F0',
        fontFamily: '"Inter", system-ui, sans-serif',
        minHeight: '100vh',
      }}
    >
      <SmoothScroll />

      {/* FLOATING PILL NAVBAR */}
      <div className="fixed top-4 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4">
        <nav
          style={{
            background: 'rgba(19,26,35,0.9)',
            border: '1px solid rgba(30,206,250,0.15)',
            backdropFilter: 'blur(20px)',
          }}
          className="flex items-center justify-between gap-1 rounded-full px-4 py-2 shadow-xl"
          aria-label="Main navigation"
        >
          <button
            type="button"
            onClick={() => scrollTo('hero')}
            style={{ color: '#1ECEFA', fontWeight: 700, fontSize: '0.875rem' }}
            className="shrink-0"
            aria-label="Go to top"
          >
            {name.split(' ')[0]}
          </button>
          <div className="hidden items-center gap-0.5 sm:flex" role="list">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                role="listitem"
                aria-current={active === id ? 'page' : undefined}
                style={{
                  background: active === id ? 'rgba(30,206,250,0.15)' : 'transparent',
                  color: active === id ? '#1ECEFA' : '#64748b',
                  border: active === id ? '1px solid rgba(30,206,250,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
                className="rounded-full px-3 py-1 text-xs font-medium capitalize"
              >
                {id}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            style={{ color: '#64748b', fontSize: '0.75rem', border: '1px solid rgba(100,116,139,0.3)' }}
            className="rounded-full px-3 py-1 sm:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </nav>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{ background: 'rgba(19,26,35,0.97)', border: '1px solid rgba(30,206,250,0.15)', marginTop: 8 }}
            className="rounded-2xl p-3 sm:hidden"
          >
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{ color: active === id ? '#1ECEFA' : '#64748b' }}
                className="block w-full rounded-xl px-4 py-2 text-left text-sm capitalize transition hover:text-cyan-300"
              >
                {id}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* HERO */}
      <section id="hero" className="relative flex min-h-screen items-center px-4 pt-24 pb-12 md:px-6 md:pt-28 md:pb-16">
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 60% 50%, rgba(30,206,250,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div className="relative mx-auto grid w-full max-w-5xl gap-8 md:gap-12 lg:grid-cols-[1fr_320px] lg:items-center">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #E2E8F0 30%, #1ECEFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {sections.hero.heading || name}
            </h1>
            {user.headline && (
              <p style={{ color: '#1ECEFA', fontWeight: 500, fontSize: '1.1rem' }}>{user.headline}</p>
            )}
            <p style={{ color: '#94a3b8', lineHeight: 1.85, maxWidth: '36rem' }}>
              {sections.hero.body || sections.about || 'A portfolio built with precision and creativity.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => scrollTo('projects')}
                style={{ background: '#1ECEFA', color: '#0C0F13', fontWeight: 700, fontSize: '0.875rem' }}
                className="rounded-full px-6 py-2.5 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0F13]"
              >
                View Projects
              </button>
              <button
                type="button"
                onClick={() => scrollTo('contact')}
                style={{ border: '1px solid rgba(30,206,250,0.4)', color: '#1ECEFA', fontSize: '0.875rem' }}
                className="rounded-full px-6 py-2.5 transition hover:bg-cyan-400/10"
              >
                Contact Me
              </button>
              {profile.resumeAssetId && (
                <ResumeDownloadButton
                  subdomain={subdomain}
                  ownerName={name}
                  className="rounded-full px-6 py-2.5 text-sm font-semibold transition border border-white/10 bg-white/5 text-white hover:bg-white/10"
                />
              )}
            </div>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#475569',
                      border: '1px solid rgba(71,85,105,0.3)',
                      fontSize: '0.75rem',
                    }}
                    className="rounded-full px-3 py-1 transition hover:text-cyan-300 hover:border-cyan-400/30"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* PROFILE CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(19,26,35,0.85)',
              border: '1px solid rgba(30,206,250,0.15)',
              backdropFilter: 'blur(12px)',
            }}
            className="rounded-3xl p-6 text-center space-y-5"
          >
            <div className="flex justify-center">
              <div
                style={{
                  padding: 3,
                  background: 'linear-gradient(135deg, #1ECEFA, #6366f1)',
                  borderRadius: 9999,
                }}
              >
                <NightfallAvatar url={user.avatarUrl} name={name} />
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#E2E8F0' }}>{name}</p>
              {user.headline && (
                <p style={{ color: '#64748b', fontSize: '0.82rem' }} className="mt-1">
                  {user.headline}
                </p>
              )}
            </div>
            {sections.skills.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(30,206,250,0.1)' }} className="pt-4">
                <p
                  style={{
                    color: '#334155',
                    fontSize: '0.65rem',
                    letterSpacing: '0.12em',
                    marginBottom: 10,
                  }}
                >
                  TOP SKILLS
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {sections.skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: 'rgba(30,206,250,0.08)',
                        border: '1px solid rgba(30,206,250,0.2)',
                        color: '#7dd3fc',
                        fontSize: '0.7rem',
                      }}
                      className="rounded-full px-2.5 py-0.5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-12 flex items-center gap-4">
              <span style={{ color: '#1ECEFA', fontFamily: 'monospace', fontSize: '0.8rem' }}>01.</span>
              <h2 style={{ fontWeight: 700, fontSize: '1.75rem' }}>About Me</h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(30,206,250,0.12)' }} />
            </div>
          </FadeIn>
          <div className="grid gap-10 lg:grid-cols-2">
            <FadeIn delay={0.05}>
              <p style={{ color: '#94a3b8', lineHeight: 1.9, fontSize: '0.95rem' }}>
                {sections.about || sections.hero.body || 'No biography available yet.'}
              </p>
            </FadeIn>
            {sections.experience.length > 0 && (
              <FadeIn delay={0.1}>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#cbd5e1', marginBottom: 20 }}>
                  Experience
                </h3>
                <ExperienceTimeline items={sections.experience} />
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-12 flex items-center gap-4">
              <span style={{ color: '#1ECEFA', fontFamily: 'monospace', fontSize: '0.8rem' }}>02.</span>
              <h2 style={{ fontWeight: 700, fontSize: '1.75rem' }}>Projects</h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(30,206,250,0.12)' }} />
            </div>
          </FadeIn>
          {sections.projects.length > 0 ? (
            <FadeInGroup className="grid gap-6 sm:grid-cols-2">
              {sections.projects.map((project, i) => (
                <FadeInItem key={`${project.title}-${i}`}>
                  <NightfallProjectCard project={project} />
                </FadeInItem>
              ))}
            </FadeInGroup>
          ) : (
            <FadeIn>
              <div
                style={{ border: '1px solid rgba(30,206,250,0.1)', background: 'rgba(19,26,35,0.5)' }}
                className="rounded-2xl p-10 text-center"
              >
                <p style={{ color: '#334155' }}>No projects added yet.</p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-12 flex items-center gap-4">
              <span style={{ color: '#1ECEFA', fontFamily: 'monospace', fontSize: '0.8rem' }}>03.</span>
              <h2 style={{ fontWeight: 700, fontSize: '1.75rem' }}>Skills</h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(30,206,250,0.12)' }} />
            </div>
          </FadeIn>
          {sections.skills.length > 0 ? (
            <FadeInGroup className="flex flex-wrap gap-3">
              {sections.skills.map((skill) => (
                <FadeInItem key={skill}>
                  <SkillBadge
                    skill={skill}
                    persona={skillPersona}
                    className="border-cyan-400/20 bg-cyan-500/5 text-slate-100"
                  />
                </FadeInItem>
              ))}
            </FadeInGroup>
          ) : (
            <p style={{ color: '#334155' }}>No skills listed yet.</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-12 flex items-center gap-4">
              <span style={{ color: '#1ECEFA', fontFamily: 'monospace', fontSize: '0.8rem' }}>04.</span>
              <h2 style={{ fontWeight: 700, fontSize: '1.75rem' }}>Contact</h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(30,206,250,0.12)' }} />
            </div>
          </FadeIn>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <FadeIn delay={0.05}>
              <div
                style={{
                  background: 'rgba(30,206,250,0.04)',
                  border: '1px solid rgba(30,206,250,0.15)',
                }}
                className="rounded-2xl p-6 space-y-4"
              >
                <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>Let's work together</p>
                <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '0.9rem' }}>
                  {sections.contact || 'Open to collaborations, freelance work, and exciting projects.'}
                </p>
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    style={{ color: '#1ECEFA', fontWeight: 600, fontSize: '0.875rem' }}
                    className="block transition hover:opacity-80"
                  >
                    {contactEmail}
                  </a>
                )}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#475569',
                          border: '1px solid rgba(71,85,105,0.3)',
                          fontSize: '0.73rem',
                        }}
                        className="rounded-full px-3 py-1 transition hover:text-cyan-300"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div
                style={{
                  background: 'rgba(19,26,35,0.85)',
                  border: '1px solid rgba(30,206,250,0.1)',
                }}
                className="rounded-2xl p-6"
              >
                <ContactForm
                  recipientEmail={contactEmail}
                  theme={{
                    labelClassName: 'mb-1.5 block text-sm font-medium text-slate-400',
                    inputClassName:
                      'w-full rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10',
                    textareaClassName:
                      'w-full rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10',
                    buttonClassName:
                      'inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60',
                    successClassName:
                      'rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-200',
                    errorClassName: 'mt-1 text-xs text-rose-400',
                  }}
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(30,206,250,0.08)' }} className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p style={{ color: '#1e293b', fontSize: '0.8rem' }}>© {new Date().getFullYear()} {name}</p>
        </div>
      </footer>
    </main>
  );
}
