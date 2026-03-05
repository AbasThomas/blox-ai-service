'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';

interface MinimalTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

function MinimalAvatar({ url, name, size = 180 }: { url?: string; name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: '#f0effd',
          border: '1px solid #d1d5db',
          borderRadius: 9999,
        }}
        className="flex items-center justify-center text-4xl font-light text-indigo-400"
      >
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 9999 }} className="object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={size} height={size} className="rounded-full object-cover" />;
}

function MinimalFeaturedProject({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  return (
    <article
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {imgUrl && (
        <div style={{ position: 'relative', aspectRatio: '21/9', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
      )}
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {project.tags?.slice(0, 3).map((tag) => (
            <span key={tag} style={{ color: '#6366f1', fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: 500 }}>
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
        <h3 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '1.6rem', fontWeight: 700, color: '#1e1b4b', lineHeight: 1.3 }}>
          {project.title}
        </h3>
        {project.description && (
          <p style={{ color: '#6b7280', lineHeight: 1.75, marginTop: 10, fontSize: '0.92rem' }}>
            {project.description}
          </p>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              color: '#6366f1',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
            className="transition hover:opacity-70"
          >
            Read case study →
          </a>
        )}
      </div>
    </article>
  );
}

function MinimalProjectCard({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  return (
    <article style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {imgUrl && (
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
      )}
      <div style={{ padding: 20 }}>
        {project.tags?.slice(0, 2).map((tag) => (
          <span key={tag} style={{ color: '#6366f1', fontSize: '0.68rem', letterSpacing: '0.08em', fontWeight: 500, marginRight: 8 }}>
            {tag.toUpperCase()}
          </span>
        ))}
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1e1b4b', marginTop: 8, lineHeight: 1.35 }}>
          {project.title}
        </h3>
        {project.description && (
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', lineHeight: 1.65, marginTop: 6 }}>
            {project.description.slice(0, 100)}{project.description.length > 100 ? '...' : ''}
          </p>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 600, marginTop: 10, display: 'block' }}
            className="transition hover:opacity-70"
          >
            View →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function MinimalTemplate({ profile, subdomain }: MinimalTemplateProps) {
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

  const [featuredProject, ...otherProjects] = sections.projects;

  return (
    <main
      style={{
        background: '#FAFAFA',
        color: '#1E1B4B',
        fontFamily: '"Inter", system-ui, sans-serif',
        minHeight: '100vh',
      }}
    >
      <SmoothScroll />

      {/* ULTRA-MINIMAL SERIF NAVBAR */}
      <header
        style={{
          background: 'rgba(250,250,250,0.96)',
          borderBottom: '1px solid #e5e7eb',
          backdropFilter: 'blur(8px)',
        }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => scrollTo('hero')}
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 400,
              fontSize: '1.1rem',
              color: '#1e1b4b',
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  color: active === id ? '#6366f1' : '#9ca3af',
                  fontSize: '0.8rem',
                  fontWeight: 400,
                  borderBottom: active === id ? '1px solid #6366f1' : '1px solid transparent',
                  paddingBottom: 1,
                  transition: 'all 0.2s',
                }}
                className="capitalize"
              >
                {id}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            style={{ color: '#9ca3af', fontSize: '0.8rem' }}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '≡'}
          </button>
        </div>

        {mobileOpen && (
          <div
            style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}
            className="md:hidden"
          >
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{ color: active === id ? '#6366f1' : '#6b7280' }}
                className="block w-full py-2.5 text-left text-sm capitalize"
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO — EDITORIAL TWO-COL */}
      <section id="hero" className="flex min-h-screen items-center px-6 pt-20 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(2.6rem, 6vw, 5rem)',
                fontWeight: 700,
                lineHeight: 1.05,
                color: '#1e1b4b',
                letterSpacing: '-0.02em',
              }}
            >
              {sections.hero.heading || name}
            </h1>
            {user.headline && (
              <p style={{ color: '#6366f1', fontSize: '1.05rem', fontWeight: 500, marginTop: 16 }}>
                {user.headline}
              </p>
            )}
            <p
              style={{
                color: '#6b7280',
                lineHeight: 1.85,
                marginTop: 18,
                maxWidth: '38rem',
                fontSize: '0.95rem',
              }}
            >
              {sections.hero.body || sections.about || 'Crafting thoughtful digital experiences.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
              <button
                type="button"
                onClick={() => scrollTo('projects')}
                style={{
                  background: '#1e1b4b',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '10px 24px',
                  borderRadius: 8,
                }}
                className="transition hover:opacity-80"
              >
                View Work
              </button>
              <button
                type="button"
                onClick={() => scrollTo('contact')}
                style={{
                  border: '1px solid #d1d5db',
                  color: '#6b7280',
                  fontSize: '0.85rem',
                  padding: '10px 24px',
                  borderRadius: 8,
                }}
                className="transition hover:border-indigo-300 hover:text-indigo-500"
              >
                Say Hello
              </button>
            </div>
            {socialLinks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#d1d5db', fontSize: '0.78rem' }}
                    className="transition hover:text-indigo-400"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 lg:items-end">
            <MinimalAvatar url={user.avatarUrl} name={name} size={180} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: '0.9rem', color: '#6b7280' }}>
                {name}
              </p>
              {user.headline && (
                <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginTop: 2 }}>{user.headline}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background: '#fff', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-2">
          <div>
            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#1e1b4b',
                marginBottom: 20,
              }}
            >
              About
            </h2>
            <p style={{ color: '#6b7280', lineHeight: 1.9, fontSize: '0.95rem' }}>
              {sections.about || sections.hero.body || 'No biography available yet.'}
            </p>
          </div>

          {sections.experience.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '0.72rem',
                  color: '#9ca3af',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                EXPERIENCE
              </h3>
              <div className="space-y-6">
                {sections.experience.map((exp, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e1b4b' }}>{exp.role}</p>
                        {exp.company && (
                          <p style={{ color: '#6366f1', fontSize: '0.8rem', marginTop: 2 }}>{exp.company}</p>
                        )}
                      </div>
                      {exp.period && (
                        <span style={{ color: '#d1d5db', fontSize: '0.72rem' }}>{exp.period}</span>
                      )}
                    </div>
                    {exp.summary && (
                      <p style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.65, marginTop: 8 }}>
                        {exp.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PROJECTS — MAGAZINE LAYOUT */}
      <section id="projects" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1e1b4b',
              marginBottom: 32,
            }}
          >
            Projects
          </h2>
          {sections.projects.length === 0 ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#d1d5db' }}>No projects added yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {featuredProject && <MinimalFeaturedProject project={featuredProject} />}
              {otherProjects.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 20,
                  }}
                >
                  {otherProjects.map((project, i) => (
                    <MinimalProjectCard key={i} project={project} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SKILLS — MINIMAL TEXT */}
      <section id="skills" style={{ background: '#fff', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1e1b4b',
              marginBottom: 28,
            }}
          >
            Skills
          </h2>
          {sections.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {sections.skills.map((skill, i) => (
                <span
                  key={skill}
                  style={{
                    color: '#6b7280',
                    fontSize: '0.9rem',
                  }}
                >
                  {skill}
                  {i < sections.skills.length - 1 && (
                    <span style={{ color: '#d1d5db', marginLeft: 10 }}>·</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: '#d1d5db' }}>No skills listed yet.</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#1e1b4b',
                  marginBottom: 16,
                }}
              >
                Say Hello
              </h2>
              <p style={{ color: '#6b7280', lineHeight: 1.8, fontSize: '0.92rem' }}>
                {sections.contact || 'Always open to interesting conversations and collaborations.'}
              </p>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginTop: 16 }}
                  className="transition hover:opacity-70"
                >
                  {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                  {socialLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#9ca3af', fontSize: '0.8rem' }}
                      className="transition hover:text-indigo-400"
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              )}
            </div>

            <ContactForm
              recipientEmail={contactEmail}
              theme={{
                formClassName: 'space-y-4',
                labelClassName: 'mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wide',
                inputClassName:
                  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100',
                textareaClassName:
                  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100',
                buttonClassName:
                  'inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60',
                successClassName:
                  'rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700',
                errorClassName: 'mt-1 text-xs text-rose-500',
              }}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #e5e7eb', background: '#fff' }} className="px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p style={{ color: '#d1d5db', fontSize: '0.78rem', fontFamily: 'Georgia, serif' }}>
            © {new Date().getFullYear()} {name}
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {socialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#d1d5db', fontSize: '0.78rem' }}
                className="transition hover:text-indigo-400"
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
