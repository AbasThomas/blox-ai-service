'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';
import {
  SiReact, SiTypescript, SiJavascript, SiNodedotjs, SiNextdotjs, SiVuedotjs,
  SiAngular, SiDocker, SiGo, SiGit, SiGithub, SiPostgresql, SiMysql, SiRedis,
  SiFirebase, SiFlutter, SiFigma, SiTailwindcss, SiGraphql, SiDjango, SiExpress,
  SiLaravel, SiSketch, SiFramer, SiWebflow, SiOpenjdk, SiSpring,
} from 'react-icons/si';
import { FaPaintbrush, FaPenRuler } from 'react-icons/fa6';
import { FiCode } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface FreelanceTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

const SKILL_ICONS: Record<string, { icon: IconType; color: string }> = {
  react: { icon: SiReact, color: '#61DAFB' },
  javascript: { icon: SiJavascript, color: '#F7DF1E' },
  typescript: { icon: SiTypescript, color: '#3178C6' },
  'node.js': { icon: SiNodedotjs, color: '#339933' },
  nodejs: { icon: SiNodedotjs, color: '#339933' },
  nextjs: { icon: SiNextdotjs, color: '#ffffff' },
  'next.js': { icon: SiNextdotjs, color: '#ffffff' },
  vue: { icon: SiVuedotjs, color: '#4FC08D' },
  'vue.js': { icon: SiVuedotjs, color: '#4FC08D' },
  angular: { icon: SiAngular, color: '#DD0031' },
  docker: { icon: SiDocker, color: '#2496ED' },
  go: { icon: SiGo, color: '#00ACD7' },
  git: { icon: SiGit, color: '#F05032' },
  github: { icon: SiGithub, color: '#ffffff' },
  postgresql: { icon: SiPostgresql, color: '#336791' },
  postgres: { icon: SiPostgresql, color: '#336791' },
  mysql: { icon: SiMysql, color: '#4479A1' },
  redis: { icon: SiRedis, color: '#DC382D' },
  firebase: { icon: SiFirebase, color: '#FFCA28' },
  flutter: { icon: SiFlutter, color: '#02569B' },
  figma: { icon: SiFigma, color: '#F24E1E' },
  tailwind: { icon: SiTailwindcss, color: '#06B6D4' },
  tailwindcss: { icon: SiTailwindcss, color: '#06B6D4' },
  graphql: { icon: SiGraphql, color: '#E10098' },
  django: { icon: SiDjango, color: '#092E20' },
  express: { icon: SiExpress, color: '#ffffff' },
  laravel: { icon: SiLaravel, color: '#FF2D20' },
  sketch: { icon: SiSketch, color: '#F7B500' },
  framer: { icon: SiFramer, color: '#0055FF' },
  webflow: { icon: SiWebflow, color: '#4353FF' },
  java: { icon: SiOpenjdk, color: '#ED8B00' },
  spring: { icon: SiSpring, color: '#6DB33F' },
  photoshop: { icon: FaPaintbrush, color: '#31A8FF' },
  illustrator: { icon: FaPenRuler, color: '#FF9A00' },
};

function getSkillIcon(skill: string): { icon: IconType; color: string } {
  return SKILL_ICONS[skill.toLowerCase().trim()] ?? { icon: FiCode, color: '#F59E0B' };
}

function FreelanceAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div
        style={{ width: 96, height: 96, background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}
        className="flex items-center justify-center rounded-full text-2xl font-bold text-amber-400"
      >
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 96, height: 96 }} className="rounded-full object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={96} height={96} className="rounded-full object-cover" />;
}

function FreelanceProjectCard({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  return (
    <article
      style={{
        background: '#1A1610',
        border: '1px solid rgba(245,158,11,0.15)',
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
      }}
      className="group overflow-hidden rounded-2xl transition hover:border-amber-500/40"
    >
      <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
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
            style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.1), rgba(180,83,9,0.05))' }}
            className="flex h-full w-full items-center justify-center"
          >
            <span style={{ color: '#44320c', fontSize: '0.8rem' }}>No preview</span>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between p-5">
        <div className="space-y-2">
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#FEF3C7' }}>{project.title}</h3>
          {project.description && (
            <p style={{ color: '#92400E', fontSize: '0.83rem', lineHeight: 1.6 }}>{project.description}</p>
          )}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    color: '#D97706',
                    fontSize: '0.68rem',
                  }}
                  className="rounded-full px-2.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#F59E0B',
              color: '#0F0D0A',
              fontWeight: 700,
              fontSize: '0.78rem',
              marginTop: 14,
              display: 'inline-block',
              width: 'fit-content',
            }}
            className="rounded-full px-4 py-1.5 transition hover:bg-amber-400"
          >
            View Project →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function FreelanceTemplate({ profile, subdomain }: FreelanceTemplateProps) {
  const { sections, user } = profile;
  const name = user?.fullName || 'Portfolio Owner';
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
        background: '#0F0D0A',
        color: '#FEF3C7',
        fontFamily: '"Inter", system-ui, sans-serif',
        minHeight: '100vh',
      }}
    >
      <SmoothScroll />

      {/* FULL-WIDTH STICKY NAV WITH HIRE ME BUTTON */}
      <header
        style={{
          background: 'rgba(26,22,16,0.95)',
          borderBottom: '1px solid rgba(245,158,11,0.12)',
          backdropFilter: 'blur(16px)',
        }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div style={{ width: 8, height: 8, background: '#F59E0B', borderRadius: 9999 }} />
            <button
              type="button"
              onClick={() => scrollTo('hero')}
              style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.95rem' }}
            >
              {name}
            </button>
            <span
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#F59E0B',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
              className="rounded-full px-2.5 py-0.5"
            >
              Available
            </span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  color: active === id ? '#F59E0B' : '#78350F',
                  fontWeight: active === id ? 600 : 400,
                  fontSize: '0.875rem',
                  borderBottom: active === id ? '2px solid #F59E0B' : '2px solid transparent',
                  paddingBottom: 2,
                  transition: 'all 0.2s',
                }}
                className="capitalize"
              >
                {id}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollTo('contact')}
              style={{
                background: '#F59E0B',
                color: '#0F0D0A',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
              className="hidden rounded-full px-5 py-2 transition hover:bg-amber-400 md:inline-flex"
            >
              Hire Me
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              style={{ color: '#78350F', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem' }}
              className="rounded-lg px-3 py-1.5 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            style={{ background: '#1A1610', borderTop: '1px solid rgba(245,158,11,0.1)' }}
            className="px-6 py-4 md:hidden"
          >
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{ color: active === id ? '#F59E0B' : '#78350F' }}
                className="block w-full py-2.5 text-left text-sm capitalize transition hover:text-amber-400"
              >
                {id}
              </button>
            ))}
            <button
              type="button"
              onClick={() => scrollTo('contact')}
              style={{ background: '#F59E0B', color: '#0F0D0A', fontWeight: 700, fontSize: '0.8rem' }}
              className="mt-3 w-full rounded-full py-2 transition hover:bg-amber-400"
            >
              Hire Me
            </button>
          </div>
        )}
      </header>

      {/* HERO — CENTERED */}
      <section id="hero" className="flex min-h-screen flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-center">
            <FreelanceAvatar url={user?.avatarUrl} name={name} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                color: '#FEF3C7',
              }}
            >
              {sections.hero.heading || `Hi, I'm ${name}`}
            </h1>
            {user?.headline && (
              <p style={{ color: '#F59E0B', fontWeight: 500, fontSize: '1.1rem' }} className="mt-3">
                {user.headline}
              </p>
            )}
            <p style={{ color: '#92400E', lineHeight: 1.8, maxWidth: '32rem', margin: '16px auto 0' }}>
              {sections.hero.body || sections.about || 'Building digital solutions that drive real results.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollTo('projects')}
              style={{ background: '#F59E0B', color: '#0F0D0A', fontWeight: 700 }}
              className="rounded-full px-6 py-2.5 text-sm transition hover:bg-amber-400"
            >
              See My Work
            </button>
            <button
              type="button"
              onClick={() => scrollTo('contact')}
              style={{ border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B' }}
              className="rounded-full px-6 py-2.5 text-sm transition hover:bg-amber-500/10"
            >
              Get In Touch
            </button>
          </div>

          {/* STATS ROW */}
          {sections.experience.length > 0 && (
            <div
              style={{ borderTop: '1px solid rgba(245,158,11,0.1)', paddingTop: 28 }}
              className="flex flex-wrap justify-center gap-8"
            >
              <div>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
                  {sections.projects.length}+
                </p>
                <p style={{ fontSize: '0.75rem', color: '#78350F' }}>Projects</p>
              </div>
              <div>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
                  {sections.experience.length}+
                </p>
                <p style={{ fontSize: '0.75rem', color: '#78350F' }}>Roles</p>
              </div>
              <div>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
                  {sections.skills.length}+
                </p>
                <p style={{ fontSize: '0.75rem', color: '#78350F' }}>Skills</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background: '#1A1610' }} className="px-6 py-24">
        <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-2">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#FEF3C7' }} className="mb-4">
              About Me
            </h2>
            <p style={{ color: '#92400E', lineHeight: 1.85, fontSize: '0.95rem' }}>
              {sections.about || sections.hero.body || 'No biography available yet.'}
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.875rem', marginTop: 20, display: 'block' }}
                className="transition hover:opacity-80"
              >
                {contactEmail}
              </a>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#92400E',
                      border: '1px solid rgba(245,158,11,0.2)',
                      fontSize: '0.75rem',
                    }}
                    className="rounded-full px-3 py-1 transition hover:text-amber-400"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {sections.experience.length > 0 && (
            <div className="space-y-4">
              <h3 style={{ fontWeight: 600, color: '#F59E0B', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                EXPERIENCE
              </h3>
              {sections.experience.map((exp, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: '3px solid rgba(245,158,11,0.4)',
                    paddingLeft: 14,
                  }}
                >
                  <p style={{ fontWeight: 600, color: '#FEF3C7', fontSize: '0.92rem' }}>{exp.role}</p>
                  {exp.company && (
                    <p style={{ color: '#F59E0B', fontSize: '0.8rem' }} className="mt-0.5">
                      {exp.company}
                    </p>
                  )}
                  {exp.period && (
                    <p style={{ color: '#44320c', fontSize: '0.73rem' }} className="mt-0.5">
                      {exp.period}
                    </p>
                  )}
                  {exp.summary && (
                    <p style={{ color: '#78350F', fontSize: '0.83rem', lineHeight: 1.6 }} className="mt-1.5">
                      {exp.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROJECTS — HORIZONTAL CARDS */}
      <section id="projects" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#FEF3C7', marginBottom: 32 }}>
            Projects
          </h2>
          {sections.projects.length > 0 ? (
            <div className="space-y-5">
              {sections.projects.map((project, i) => (
                <FreelanceProjectCard key={i} project={project} />
              ))}
            </div>
          ) : (
            <div
              style={{ background: '#1A1610', border: '1px solid rgba(245,158,11,0.1)' }}
              className="rounded-2xl p-10 text-center"
            >
              <p style={{ color: '#44320c' }}>No projects added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* SKILLS — ICON GRID */}
      <section id="skills" style={{ background: '#1A1610' }} className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#FEF3C7', marginBottom: 32 }}>
            Skills & Tools
          </h2>
          {sections.skills.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {sections.skills.map((skill) => {
                const { icon: Icon, color } = getSkillIcon(skill);
                return (
                  <div
                    key={skill}
                    style={{ background: '#0F0D0A', border: '1px solid rgba(245,158,11,0.1)' }}
                    className="flex flex-col items-center gap-2.5 rounded-2xl p-4 transition hover:border-amber-500/30"
                  >
                    <Icon style={{ color, width: 28, height: 28 }} aria-hidden />
                    <span style={{ color: '#92400E', fontSize: '0.72rem', textAlign: 'center' }}>{skill}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#44320c' }}>No skills listed yet.</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#FEF3C7', marginBottom: 8 }}>
            Work Together
          </h2>
          <p style={{ color: '#78350F', marginBottom: 32, fontSize: '0.9rem' }}>
            {sections.contact || 'Let\'s discuss your next project. I respond within 24 hours.'}
          </p>
          <div
            style={{ background: '#1A1610', border: '1px solid rgba(245,158,11,0.12)' }}
            className="rounded-3xl p-8"
          >
            <ContactForm
              recipientEmail={contactEmail}
              theme={{
                formClassName: 'space-y-4',
                labelClassName: 'mb-1.5 block text-sm font-medium text-amber-700',
                inputClassName:
                  'w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-100 outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10',
                textareaClassName:
                  'w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-100 outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10',
                buttonClassName:
                  'inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-400 disabled:opacity-60',
                successClassName:
                  'rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200',
                errorClassName: 'mt-1 text-xs text-rose-400',
              }}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(245,158,11,0.08)', background: '#1A1610' }} className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p style={{ color: '#44320c', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} {name}
          </p>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#78350F', fontSize: '0.78rem' }}
                className="transition hover:text-amber-400"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
