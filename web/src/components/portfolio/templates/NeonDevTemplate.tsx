'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';
import { getSkillIconData } from './shared/SkillBadge';

interface NeonDevTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

function NeonAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div
        style={{ width: 120, height: 120, background: 'rgba(139,92,246,0.12)', border: '2px solid rgba(139,92,246,0.4)' }}
        className="flex items-center justify-center rounded-full text-3xl font-bold text-violet-400"
      >
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 120, height: 120 }} className="rounded-full object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={120} height={120} className="rounded-full object-cover" />;
}

function CodeBlock({ name, headline, skills }: { name: string; headline?: string; skills: string[] }) {
  return (
    <div
      style={{
        background: '#0a0010',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 12,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: '0.8rem',
        lineHeight: 1.8,
        overflow: 'hidden',
      }}
    >
      {/* Editor titlebar */}
      <div style={{ background: '#050008', borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#ef4444', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#f59e0b', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#22c55e', display: 'inline-block' }} />
        <span style={{ color: '#4c1d95', fontSize: '0.7rem', marginLeft: 8 }}>portfolio.ts</span>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <div><span style={{ color: '#7c3aed' }}>const</span> <span style={{ color: '#c4b5fd' }}>developer</span> <span style={{ color: '#ec4899' }}>=</span> <span style={{ color: '#a78bfa' }}>{'{'}</span></div>
        <div style={{ paddingLeft: 20 }}>
          <span style={{ color: '#818cf8' }}>name</span><span style={{ color: '#ec4899' }}>:</span> <span style={{ color: '#34d399' }}>&quot;{name}&quot;</span><span style={{ color: '#6d28d9' }}>,</span>
        </div>
        {headline && (
          <div style={{ paddingLeft: 20 }}>
            <span style={{ color: '#818cf8' }}>role</span><span style={{ color: '#ec4899' }}>:</span> <span style={{ color: '#34d399' }}>&quot;{headline}&quot;</span><span style={{ color: '#6d28d9' }}>,</span>
          </div>
        )}
        <div style={{ paddingLeft: 20 }}>
          <span style={{ color: '#818cf8' }}>available</span><span style={{ color: '#ec4899' }}>:</span> <span style={{ color: '#f59e0b' }}>true</span><span style={{ color: '#6d28d9' }}>,</span>
        </div>
        {skills.length > 0 && (
          <>
            <div style={{ paddingLeft: 20 }}>
              <span style={{ color: '#818cf8' }}>skills</span><span style={{ color: '#ec4899' }}>:</span> <span style={{ color: '#a78bfa' }}>[</span>
            </div>
            {skills.slice(0, 5).map((s, i) => (
              <div key={s} style={{ paddingLeft: 40 }}>
                <span style={{ color: '#34d399' }}>&quot;{s}&quot;</span>
                {i < Math.min(skills.length, 5) - 1 && <span style={{ color: '#6d28d9' }}>,</span>}
              </div>
            ))}
            {skills.length > 5 && (
              <div style={{ paddingLeft: 40, color: '#4c1d95' }}>// +{skills.length - 5} more</div>
            )}
            <div style={{ paddingLeft: 20, color: '#a78bfa' }}>]</div>
          </>
        )}
        <div style={{ color: '#a78bfa' }}>{'}'}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ color: '#7c3aed' }}>export default</span> <span style={{ color: '#c4b5fd' }}>developer</span><span style={{ color: '#ec4899' }}>;</span>
        </div>
      </div>
    </div>
  );
}

function NeonProjectCard({ project, index }: { project: PublicProfilePayload['sections']['projects'][number]; index: number }) {
  const borderColors = ['#8b5cf6', '#ec4899', '#22d3ee', '#34d399', '#f59e0b'];
  const color = borderColors[index % borderColors.length];
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  const primaryTag = project.tags?.[0];

  return (
    <article
      style={{
        background: '#0a0010',
        border: '1px solid rgba(139,92,246,0.15)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      className="group hover:border-violet-500/40"
    >
      {imgUrl && (
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.3s' }} loading="lazy" className="group-hover:opacity-100" />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${color}22, transparent)` }} />
        </div>
      )}
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>{project.title}</h3>
          {primaryTag && (
            <span style={{ background: `${color}22`, border: `1px solid ${color}55`, color, fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {primaryTag}
            </span>
          )}
        </div>
        {project.description && (
          <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.65 }}>{project.description}</p>
        )}
        {project.tags && project.tags.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {project.tags.slice(1).map((tag) => (
              <span key={tag} style={{ color: '#475569', fontSize: '0.68rem', border: '1px solid rgba(71,85,105,0.3)', padding: '1px 7px', borderRadius: 4, fontFamily: 'monospace' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, color, fontSize: '0.78rem', fontWeight: 600 }} className="transition hover:opacity-70">
            Open project →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function NeonDevTemplate({ profile, subdomain }: NeonDevTemplateProps) {
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
    <main style={{ background: '#0d0015', color: '#e2e8f0', fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      <SmoothScroll />

      {/* NAV — browser address bar style with neon gradient underline */}
      <header style={{ background: 'rgba(13,0,21,0.95)', backdropFilter: 'blur(16px)' }} className="fixed inset-x-0 top-0 z-50">
        <div style={{ height: 3, background: 'linear-gradient(to right, #8b5cf6, #ec4899, #22d3ee)' }} />
        <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-6 py-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 6, padding: '3px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#a78bfa' }}>
              portfolio://site
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  background: active === id ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: active === id ? '#a78bfa' : '#475569',
                  border: active === id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  fontSize: '0.78rem',
                  padding: '4px 12px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                  fontFamily: 'monospace',
                }}
                className="capitalize"
              >
                {active === id ? '> ' : ''}{id}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: '0.65rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20 }} className="hidden md:inline-flex">
              ● open to work
            </span>
            <button type="button" onClick={() => setMobileOpen((p) => !p)} style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.8rem' }} className="md:hidden" aria-label="Toggle menu">
              {mobileOpen ? '[x]' : '[≡]'}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ background: '#0a0010', borderTop: '1px solid rgba(139,92,246,0.15)', padding: '12px 24px' }}>
            {NAV_ITEMS.map((id) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} style={{ color: active === id ? '#a78bfa' : '#475569', fontFamily: 'monospace', fontSize: '0.8rem' }} className="block w-full py-2 text-left">
                &gt; {id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="flex min-h-screen items-center px-6 pt-24 pb-16">
        <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <NeonAvatar url={user.avatarUrl} name={name} />
              <div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.15, background: 'linear-gradient(135deg, #c4b5fd 0%, #ec4899 60%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {name}
                </h1>
                {user.headline && <p style={{ color: '#a78bfa', fontWeight: 500, marginTop: 4 }}>{user.headline}</p>}
              </div>
            </div>
            <p style={{ color: '#475569', lineHeight: 1.85, fontSize: '0.92rem', maxWidth: '36rem' }}>
              {sections.hero.body || sections.about || 'Building scalable, high-performance applications with modern technologies.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => scrollTo('projects')} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', borderRadius: 8, padding: '10px 24px' }} className="transition hover:opacity-90">
                View Projects
              </button>
              <button type="button" onClick={() => scrollTo('contact')} style={{ border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', fontSize: '0.85rem', borderRadius: 8, padding: '10px 22px' }} className="transition hover:bg-violet-500/10">
                Contact
              </button>
            </div>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#334155', fontSize: '0.75rem', border: '1px solid rgba(51,65,85,0.4)', borderRadius: 20, padding: '3px 10px' }} className="transition hover:text-violet-400 hover:border-violet-500/30">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <CodeBlock name={name} headline={user.headline} skills={sections.skills} />
        </div>
      </section>

      {/* ABOUT + EXPERIENCE */}
      <section id="about" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-center gap-3">
            <span style={{ color: '#ec4899', fontFamily: 'monospace', fontSize: '0.75rem' }}>// about</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(236,72,153,0.3), transparent)' }} />
          </div>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p style={{ color: '#64748b', lineHeight: 1.9, fontSize: '0.92rem' }}>
                {sections.about || sections.hero.body || 'No biography available yet.'}
              </p>
            </div>
            {sections.experience.length > 0 && (
              <div className="space-y-4">
                {sections.experience.map((exp, i) => (
                  <div key={i} style={{ background: '#0a0010', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#c4b5fd', fontSize: '0.88rem' }}>{exp.role}</p>
                        {exp.company && <p style={{ color: '#ec4899', fontSize: '0.78rem', marginTop: 2 }}>{exp.company}</p>}
                      </div>
                      {exp.period && <span style={{ color: '#1e1b4b', fontSize: '0.7rem', fontFamily: 'monospace' }}>{exp.period}</span>}
                    </div>
                    {exp.summary && <p style={{ color: '#334155', fontSize: '0.8rem', lineHeight: 1.6, marginTop: 8 }}>{exp.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-center gap-3">
            <span style={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '0.75rem' }}>// projects</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(34,211,238,0.3), transparent)' }} />
          </div>
          {sections.projects.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {sections.projects.map((project, i) => (
                <NeonProjectCard key={i} project={project} index={i} />
              ))}
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(139,92,246,0.1)', borderRadius: 10, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#1e1b4b', fontFamily: 'monospace', fontSize: '0.82rem' }}>// no projects yet</p>
            </div>
          )}
        </div>
      </section>

      {/* SKILLS — progress bar style */}
      <section id="skills" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-center gap-3">
            <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.75rem' }}>// skills</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(167,139,250,0.3), transparent)' }} />
          </div>
          {sections.skills.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {sections.skills.map((skill, i) => {
                const { icon: Icon, colorClass, hex } = getSkillIconData(skill);
                const barColors = ['#8b5cf6', '#ec4899', '#22d3ee', '#34d399', '#f59e0b', '#a78bfa'];
                const barColor = hex || barColors[i % barColors.length];
                return (
                  <div key={skill} style={{ background: '#0a0010', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon className={`h-4 w-4 ${colorClass}`} aria-hidden />
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace' }}>{skill}</span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${70 + (i * 7 % 25)}%`, background: barColor, borderRadius: 2, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#1e1b4b', fontFamily: 'monospace', fontSize: '0.82rem' }}>// no skills listed</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 flex items-center gap-3">
            <span style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '0.75rem' }}>// contact</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(52,211,153,0.3), transparent)' }} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div style={{ background: '#0a0010', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: 24 }}>
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4c1d95', marginBottom: 10 }}>// let's build something</p>
              <p style={{ fontWeight: 700, fontSize: '1.3rem', color: '#c4b5fd', lineHeight: 1.3, marginBottom: 12 }}>
                {sections.contact || 'Open to new projects and collaborations.'}
              </p>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} style={{ color: '#ec4899', fontWeight: 600, fontSize: '0.83rem', fontFamily: 'monospace' }} className="block transition hover:opacity-70">
                  {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                  {socialLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#334155', fontSize: '0.72rem', border: '1px solid rgba(51,65,85,0.3)', borderRadius: 20, padding: '3px 10px' }} className="transition hover:text-violet-400">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: '#0a0010', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 12, padding: 24 }}>
              <ContactForm
                recipientEmail={contactEmail}
                theme={{
                  labelClassName: 'mb-1 block text-xs font-medium text-violet-900',
                  inputClassName: 'w-full rounded-lg border border-violet-900/50 bg-violet-950/30 px-3 py-2.5 text-sm text-violet-200 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 font-mono',
                  textareaClassName: 'w-full rounded-lg border border-violet-900/50 bg-violet-950/30 px-3 py-2.5 text-sm text-violet-200 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 font-mono',
                  buttonClassName: 'inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60',
                  successClassName: 'rounded-lg border border-violet-500/20 bg-violet-950/40 p-4 text-sm text-violet-300',
                  errorClassName: 'mt-1 text-xs text-rose-400',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }} className="px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span style={{ color: '#1e1b4b', fontFamily: 'monospace', fontSize: '0.72rem' }}>// © {new Date().getFullYear()} {name}</span>
        </div>
      </footer>
    </main>
  );
}
