'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';

interface DevTerminalTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

function TerminalWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#0D160D',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
      }}
    >
      {/* Terminal titlebar */}
      <div
        style={{
          background: '#0a110a',
          borderBottom: '1px solid rgba(34,197,94,0.15)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 9999, background: '#ef4444', display: 'inline-block' }} />
        <span style={{ width: 12, height: 12, borderRadius: 9999, background: '#f59e0b', display: 'inline-block' }} />
        <span style={{ width: 12, height: 12, borderRadius: 9999, background: '#22c55e', display: 'inline-block' }} />
        <span style={{ color: '#166534', fontSize: '0.75rem', marginLeft: 8 }}>{title}</span>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function TermLine({ prompt = true, children }: { prompt?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
      {prompt && (
        <span style={{ color: '#22c55e', flexShrink: 0, fontSize: '0.82rem' }}>$</span>
      )}
      <span style={{ color: prompt ? '#BBF7D0' : '#4ade80', fontSize: '0.82rem', lineHeight: 1.7 }}>
        {children}
      </span>
    </div>
  );
}

function TermOutput({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginLeft: 16, marginBottom: 12 }}>
      <span style={{ color: '#16a34a', fontSize: '0.8rem', lineHeight: 1.7 }}>{children}</span>
    </div>
  );
}

function DevTerminalAvatar({ url, name }: { url?: string; name: string }) {
  if (!url) return null;
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 80, height: 80 }} className="rounded-lg object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={80} height={80} className="rounded-lg object-cover" />;
}

function DevProjectCard({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const [expanded, setExpanded] = useState(false);
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;

  return (
    <TerminalWindow title={`~/projects/${project.title.toLowerCase().replace(/\s+/g, '-')}`}>
      {imgUrl && (
        <div style={{ marginBottom: 12, borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
      )}
      <TermLine>cat README.md</TermLine>
      <TermOutput>
        <span style={{ color: '#22c55e', fontWeight: 700 }}># {project.title}</span>
      </TermOutput>
      {project.description && (
        <TermOutput>
          <span style={{ color: '#4ade80' }}>{project.description}</span>
        </TermOutput>
      )}
      {project.tags && project.tags.length > 0 && (
        <>
          <TermLine>echo $STACK</TermLine>
          <TermOutput>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    color: '#4ade80',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </TermOutput>
        </>
      )}
      {project.url && (
        <>
          <TermLine>open project.url</TermLine>
          <TermOutput>
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#22c55e', textDecoration: 'underline', fontSize: '0.8rem' }}
            >
              {project.url}
            </a>
          </TermOutput>
        </>
      )}
      {project.caseStudy && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <TermLine>cat case_study.md {expanded ? '▲' : '▼'}</TermLine>
          </button>
          {expanded && (
            <TermOutput>
              <span style={{ color: '#4ade80', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {project.caseStudy}
              </span>
            </TermOutput>
          )}
        </>
      )}
    </TerminalWindow>
  );
}

const NAV_ITEMS = ['about', 'projects', 'skills', 'contact'];

export function DevTerminalTemplate({ profile, subdomain }: DevTerminalTemplateProps) {
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

  return (
    <main
      style={{
        background: '#060E06',
        color: '#BBF7D0',
        fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
        minHeight: '100vh',
      }}
    >
      <SmoothScroll />

      {/* TERMINAL-STYLE NAVBAR */}
      <header
        style={{
          background: '#000000',
          borderBottom: '1px solid rgba(34,197,94,0.15)',
        }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => scrollTo('hero')}
            style={{ fontFamily: 'inherit', fontSize: '0.82rem' }}
            className="flex items-center gap-2"
          >
            <span style={{ color: '#22c55e' }}>➜</span>
            <span style={{ color: '#4ade80' }}>~</span>
            <span style={{ color: '#16a34a' }}>/portfolio</span>
            <span style={{ color: '#22c55e', animation: 'none' }}>▌</span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  background: active === id ? 'rgba(34,197,94,0.12)' : 'transparent',
                  color: active === id ? '#22c55e' : '#166534',
                  border: active === id ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  padding: '3px 12px',
                  borderRadius: 4,
                  transition: 'all 0.2s',
                }}
              >
                ./{id}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            style={{ color: '#22c55e', fontSize: '0.75rem', fontFamily: 'inherit' }}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? '[x]' : '[≡]'}
          </button>
        </div>
        {mobileOpen && (
          <div style={{ background: '#000', borderTop: '1px solid rgba(34,197,94,0.1)', padding: '12px 24px' }}>
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{ color: active === id ? '#22c55e' : '#166534', fontFamily: 'inherit', fontSize: '0.8rem' }}
                className="block w-full py-2 text-left"
              >
                $ cd ./{id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO — TERMINAL WINDOW */}
      <section id="hero" className="flex min-h-screen items-center px-6 pt-20 pb-16">
        <div className="mx-auto w-full max-w-5xl">
          <TerminalWindow title={`${name.toLowerCase().replace(/\s+/g, '_')}@blox:~`}>
            <div className="space-y-0.5">
              <TermLine>whoami</TermLine>
              <TermOutput>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <DevTerminalAvatar url={user.avatarUrl} name={name} />
                  <div>
                    <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.1rem' }}>{name}</div>
                    {user.headline && (
                      <div style={{ color: '#16a34a', fontSize: '0.82rem', marginTop: 4 }}>{user.headline}</div>
                    )}
                  </div>
                </div>
              </TermOutput>

              <TermLine>cat bio.txt</TermLine>
              <TermOutput>
                <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                  {sections.hero.body || sections.about || 'No biography found. Add one in the editor.'}
                </span>
              </TermOutput>

              {sections.skills.length > 0 && (
                <>
                  <TermLine>echo $TOP_SKILLS</TermLine>
                  <TermOutput>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {sections.skills.slice(0, 8).map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            color: '#4ade80',
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </TermOutput>
                </>
              )}

              <TermLine>ls links/</TermLine>
              <TermOutput>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {socialLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#22c55e', textDecoration: 'underline', fontSize: '0.78rem' }}
                    >
                      {link.label}
                    </a>
                  ))}
                  {contactEmail && (
                    <a
                      href={`mailto:${contactEmail}`}
                      style={{ color: '#22c55e', textDecoration: 'underline', fontSize: '0.78rem' }}
                    >
                      email
                    </a>
                  )}
                </div>
              </TermOutput>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => scrollTo('projects')}
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    padding: '6px 16px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  $ ls projects/
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo('contact')}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(34,197,94,0.2)',
                    color: '#16a34a',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    padding: '6px 16px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  $ ./contact.sh
                </button>
              </div>
            </div>
          </TerminalWindow>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div style={{ color: '#22c55e', fontSize: '0.8rem', marginBottom: 20 }}>
            <span style={{ color: '#16a34a' }}>$ </span>cat about.md
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <TerminalWindow title="about.md">
              <div style={{ color: '#4ade80', fontSize: '0.85rem', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                {sections.about || sections.hero.body || 'No biography available yet.'}
              </div>
            </TerminalWindow>

            {sections.experience.length > 0 && (
              <TerminalWindow title="experience.log">
                {sections.experience.map((exp, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ color: '#15803d' }}>[{String(i + 1).padStart(2, '0')}]</span> {exp.role}
                    </div>
                    {exp.company && (
                      <div style={{ color: '#16a34a', fontSize: '0.75rem', marginLeft: 28 }}>
                        @ {exp.company}
                      </div>
                    )}
                    {exp.period && (
                      <div style={{ color: '#14532d', fontSize: '0.72rem', marginLeft: 28 }}>
                        {exp.period}
                      </div>
                    )}
                    {exp.summary && (
                      <div
                        style={{
                          color: '#4ade80',
                          fontSize: '0.78rem',
                          lineHeight: 1.6,
                          marginLeft: 28,
                          marginTop: 4,
                        }}
                      >
                        {exp.summary}
                      </div>
                    )}
                  </div>
                ))}
              </TerminalWindow>
            )}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div style={{ color: '#22c55e', fontSize: '0.8rem', marginBottom: 20 }}>
            <span style={{ color: '#16a34a' }}>$ </span>ls -la ~/projects/
          </div>
          {sections.projects.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {sections.projects.map((project, i) => (
                <DevProjectCard key={i} project={project} />
              ))}
            </div>
          ) : (
            <TerminalWindow title="projects/">
              <TermOutput>
                <span style={{ color: '#15803d' }}>total 0 — no projects found</span>
              </TermOutput>
            </TerminalWindow>
          )}
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div style={{ color: '#22c55e', fontSize: '0.8rem', marginBottom: 20 }}>
            <span style={{ color: '#16a34a' }}>$ </span>cat skills.json
          </div>
          <TerminalWindow title="skills.json">
            {sections.skills.length > 0 ? (
              <div style={{ fontSize: '0.82rem', lineHeight: 1.8 }}>
                <div style={{ color: '#14532d' }}>{'{'}</div>
                <div style={{ paddingLeft: 16 }}>
                  <span style={{ color: '#22c55e' }}>"skills"</span>
                  <span style={{ color: '#4ade80' }}>: [</span>
                </div>
                <div
                  style={{
                    paddingLeft: 32,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {sections.skills.map((skill, i) => (
                    <span key={skill} style={{ color: '#86efac' }}>
                      &quot;{skill}&quot;{i < sections.skills.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
                <div style={{ paddingLeft: 16, color: '#4ade80' }}>]</div>
                <div style={{ color: '#14532d' }}>{'}'}</div>
              </div>
            ) : (
              <TermOutput>
                <span style={{ color: '#15803d' }}>No skills configured yet.</span>
              </TermOutput>
            )}
          </TerminalWindow>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div style={{ color: '#22c55e', fontSize: '0.8rem', marginBottom: 20 }}>
            <span style={{ color: '#16a34a' }}>$ </span>./contact.sh
          </div>
          <TerminalWindow title="contact.sh">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
              <div style={{ fontSize: '0.82rem', lineHeight: 1.85 }}>
                <div style={{ color: '#22c55e', marginBottom: 8 }}>
                  # {sections.contact || 'Open for collaboration and interesting projects.'}
                </div>
                {contactEmail && (
                  <div>
                    <span style={{ color: '#16a34a' }}>echo $EMAIL</span>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      <a
                        href={`mailto:${contactEmail}`}
                        style={{ color: '#4ade80', textDecoration: 'underline' }}
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                {socialLinks.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ color: '#16a34a' }}>ls links/</div>
                    {socialLinks.map((link) => (
                      <div key={link.url} style={{ marginLeft: 16, marginTop: 4 }}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#4ade80', textDecoration: 'underline', fontSize: '0.78rem' }}
                        >
                          {link.label}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <ContactForm
                recipientEmail={contactEmail}
                theme={{
                  formClassName: 'space-y-4',
                  labelClassName: 'mb-1 block text-xs font-medium text-green-700',
                  inputClassName:
                    'w-full rounded border border-green-900/60 bg-green-950/40 px-3 py-2 text-sm text-green-200 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 font-mono',
                  textareaClassName:
                    'w-full rounded border border-green-900/60 bg-green-950/40 px-3 py-2 text-sm text-green-200 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 font-mono',
                  buttonClassName:
                    'inline-flex w-full items-center justify-center rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300 transition hover:bg-green-500/20 disabled:opacity-60 font-mono',
                  successClassName:
                    'rounded border border-green-500/30 bg-green-950/60 p-4 text-sm text-green-300 font-mono',
                  errorClassName: 'mt-1 text-xs text-red-400 font-mono',
                }}
              />
            </div>
          </TerminalWindow>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{ borderTop: '1px solid rgba(34,197,94,0.1)', background: '#000' }}
        className="px-6 py-5"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span style={{ color: '#14532d', fontSize: '0.75rem' }}>
            <span style={{ color: '#22c55e' }}>➜</span> © {new Date().getFullYear()} {name}
          </span>
        </div>
      </footer>
    </main>
  );
}
