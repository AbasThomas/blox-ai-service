'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';
import { getSkillIconData } from './shared/SkillBadge';

interface CanvasDesignerTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

// Designer tool brand color map — tools get their actual brand background
const TOOL_BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  figma: { bg: '#F24E1E', text: '#fff' },
  'adobe photoshop': { bg: '#31A8FF', text: '#fff' },
  photoshop: { bg: '#31A8FF', text: '#fff' },
  'adobe illustrator': { bg: '#FF9A00', text: '#fff' },
  illustrator: { bg: '#FF9A00', text: '#fff' },
  'adobe premiere': { bg: '#9999FF', text: '#fff' },
  'premiere pro': { bg: '#9999FF', text: '#fff' },
  premiere: { bg: '#9999FF', text: '#fff' },
  'after effects': { bg: '#9999FF', text: '#fff' },
  aftereffects: { bg: '#9999FF', text: '#fff' },
  'adobe after effects': { bg: '#9999FF', text: '#fff' },
  'adobe indesign': { bg: '#FF3366', text: '#fff' },
  indesign: { bg: '#FF3366', text: '#fff' },
  lightroom: { bg: '#31A8FF', text: '#fff' },
  'adobe lightroom': { bg: '#31A8FF', text: '#fff' },
  'adobe xd': { bg: '#FF61F6', text: '#fff' },
  xd: { bg: '#FF61F6', text: '#fff' },
  canva: { bg: '#00C4CC', text: '#fff' },
  blender: { bg: '#E87D0D', text: '#fff' },
  sketch: { bg: '#F7B500', text: '#1a1a1a' },
  framer: { bg: '#0055FF', text: '#fff' },
  webflow: { bg: '#4353FF', text: '#fff' },
  'affinity photo': { bg: '#7E4DD2', text: '#fff' },
  'affinity designer': { bg: '#1B72BE', text: '#fff' },
  gimp: { bg: '#5C5543', text: '#fff' },
  inkscape: { bg: '#000000', text: '#fff' },
  coreldraw: { bg: '#008200', text: '#fff' },
  'corel draw': { bg: '#008200', text: '#fff' },
  procreate: { bg: '#000000', text: '#fff' },
  'cinema 4d': { bg: '#011A6A', text: '#fff' },
  c4d: { bg: '#011A6A', text: '#fff' },
  maya: { bg: '#0078D4', text: '#fff' },
};

function getToolBrandColor(skill: string) {
  const key = skill.toLowerCase().trim();
  return TOOL_BRAND_COLORS[key] ?? { bg: '#f97316', text: '#fff' };
}

function isDesignerTool(skill: string) {
  const key = skill.toLowerCase().trim();
  return key in TOOL_BRAND_COLORS;
}

function CanvasAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div style={{ width: 110, height: 110, background: '#fff5f0', border: '2px solid #fed7aa' }} className="flex items-center justify-center rounded-full text-3xl font-bold text-orange-400">
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 110, height: 110 }} className="rounded-full object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={110} height={110} className="rounded-full object-cover" />;
}

function DesignerToolCard({ skill }: { skill: string }) {
  const { bg, text } = getToolBrandColor(skill);
  const { icon: Icon } = getSkillIconData(skill);
  return (
    <div
      style={{
        background: bg,
        borderRadius: 14,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      className="group hover:scale-105 hover:shadow-lg"
    >
      <Icon style={{ color: text, width: 28, height: 28, flexShrink: 0 }} aria-hidden />
      <span style={{ color: text, fontSize: '0.7rem', fontWeight: 600, textAlign: 'center', opacity: 0.9 }}>{skill}</span>
    </div>
  );
}

function RegularSkillBadge({ skill }: { skill: string }) {
  const { icon: Icon, colorClass } = getSkillIconData(skill);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff5f0', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.82rem', borderRadius: 20, padding: '6px 12px' }}>
      <Icon className={`h-3.5 w-3.5 ${colorClass}`} aria-hidden />
      {skill}
    </span>
  );
}

function CanvasProjectCard({ project }: { project: PublicProfilePayload['sections']['projects'][number] }) {
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  return (
    <article style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 16, overflow: 'hidden' }} className="group transition hover:border-orange-300">
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} loading="lazy" className="group-hover:scale-105" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }} className="flex items-center justify-center">
            <span style={{ color: '#fcd9bd', fontSize: '0.82rem' }}>No preview</span>
          </div>
        )}
        {project.tags && project.tags[0] && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span style={{ background: '#f97316', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {project.tags[0]}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: '18px 20px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#431407', marginBottom: 6 }}>{project.title}</h3>
        {project.description && <p style={{ color: '#9a3412', fontSize: '0.82rem', lineHeight: 1.65 }}>{project.description}</p>}
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', marginTop: 12, color: '#f97316', fontWeight: 600, fontSize: '0.8rem' }} className="transition hover:opacity-70">
            View work →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'work', 'tools', 'contact'];
const SECTION_MAP: Record<string, string> = { work: 'projects', tools: 'skills' };

export function CanvasDesignerTemplate({ profile, subdomain }: CanvasDesignerTemplateProps) {
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
  const designerTools = sections.skills.filter(isDesignerTool);
  const otherSkills = sections.skills.filter((s) => !isDesignerTool(s));

  useEffect(() => {
    const ids = ['hero', 'about', 'projects', 'skills', 'contact'];
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

  const scrollTo = (navId: string) => {
    const sectionId = SECTION_MAP[navId] ?? navId;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(sectionId);
    setMobileOpen(false);
  };

  return (
    <main style={{ background: '#fef6ee', color: '#431407', fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      <SmoothScroll />

      {/* NAV — clean white with orange accent dot */}
      <header style={{ background: 'rgba(254,246,238,0.95)', borderBottom: '1px solid #fed7aa', backdropFilter: 'blur(12px)' }} className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: 'linear-gradient(135deg, #f97316, #fb923c)' }} />
            <button type="button" onClick={() => scrollTo('hero')} style={{ fontWeight: 800, fontSize: '1rem', color: '#431407' }}>
              {name}
            </button>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  color: active === (SECTION_MAP[id] ?? id) ? '#f97316' : '#c2410c',
                  fontWeight: active === (SECTION_MAP[id] ?? id) ? 600 : 400,
                  fontSize: '0.85rem',
                  borderBottom: active === (SECTION_MAP[id] ?? id) ? '2px solid #f97316' : '2px solid transparent',
                  paddingBottom: 1,
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {id}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scrollTo('contact')} style={{ background: '#f97316', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }} className="hidden rounded-full px-5 py-2 transition hover:bg-orange-500 md:inline-flex">
              Hire Me
            </button>
            <button type="button" onClick={() => setMobileOpen((p) => !p)} style={{ color: '#c2410c' }} className="md:hidden" aria-label="Toggle menu">
              {mobileOpen ? '✕' : '≡'}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid #fed7aa', padding: '12px 24px' }} className="md:hidden">
            {NAV_ITEMS.map((id) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} style={{ color: active === (SECTION_MAP[id] ?? id) ? '#f97316' : '#c2410c' }} className="block w-full py-2.5 text-left text-sm capitalize">
                {id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="flex min-h-screen items-center px-6 pt-20 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <CanvasAvatar url={user.avatarUrl} name={name} />
            <div>
              <p style={{ color: '#c2410c', fontSize: '0.78rem', letterSpacing: '0.12em', marginBottom: 10 }}>
                {subdomain}.blox.app
              </p>
              <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, color: '#431407' }}>
                {sections.hero.heading || name}
              </h1>
              {user.headline && (
                <p style={{ color: '#f97316', fontWeight: 600, fontSize: '1.05rem', marginTop: 10 }}>{user.headline}</p>
              )}
              <p style={{ color: '#9a3412', lineHeight: 1.8, marginTop: 14, fontSize: '0.92rem', maxWidth: '36rem' }}>
                {sections.hero.body || sections.about || 'Creating beautiful, purposeful design experiences.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" onClick={() => scrollTo('work')} style={{ background: '#f97316', color: '#fff', fontWeight: 700, fontSize: '0.875rem', borderRadius: 10, padding: '11px 26px' }} className="transition hover:bg-orange-500">
                View Work
              </button>
              <button type="button" onClick={() => scrollTo('contact')} style={{ border: '2px solid #fed7aa', color: '#c2410c', fontSize: '0.875rem', borderRadius: 10, padding: '9px 22px' }} className="transition hover:border-orange-300">
                Get In Touch
              </button>
            </div>
            {/* Designer tool strip */}
            {designerTools.length > 0 && (
              <div>
                <p style={{ color: '#c2410c', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: 10 }}>TOOLS I USE</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {designerTools.slice(0, 6).map((skill) => {
                    const { bg, text } = getToolBrandColor(skill);
                    const { icon: Icon } = getSkillIconData(skill);
                    return (
                      <span key={skill} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: text, fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>
                        <Icon style={{ width: 13, height: 13 }} aria-hidden />
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {socialLinks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {socialLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#c2410c', fontSize: '0.78rem' }} className="transition hover:text-orange-500">
                    {link.label} →
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Project image mosaic */}
          {sections.projects.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 420 }}>
              {sections.projects.slice(0, 4).map((project, i) => {
                const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
                return (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: '#fff5f0', border: '1px solid #fed7aa' }}>
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #fff7ed, #ffedd5)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fcd9bd', fontSize: '0.75rem' }}>{project.title.slice(0, 1)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background: '#fff', borderTop: '1px solid #fed7aa', borderBottom: '1px solid #fed7aa' }} className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#431407', marginBottom: 16 }}>About Me</h2>
            <p style={{ color: '#9a3412', lineHeight: 1.85, fontSize: '0.92rem' }}>
              {sections.about || sections.hero.body || 'No biography available yet.'}
            </p>
          </div>
          {sections.experience.length > 0 && (
            <div className="space-y-5">
              <h3 style={{ fontWeight: 600, fontSize: '0.72rem', color: '#c2410c', letterSpacing: '0.1em', marginBottom: 16 }}>EXPERIENCE</h3>
              {sections.experience.map((exp, i) => (
                <div key={i} style={{ borderLeft: '3px solid #fed7aa', paddingLeft: 14 }}>
                  <p style={{ fontWeight: 700, color: '#431407', fontSize: '0.9rem' }}>{exp.role}</p>
                  {exp.company && <p style={{ color: '#f97316', fontSize: '0.78rem', marginTop: 2 }}>{exp.company}</p>}
                  {exp.period && <p style={{ color: '#c2410c', fontSize: '0.7rem', marginTop: 1 }}>{exp.period}</p>}
                  {exp.summary && <p style={{ color: '#9a3412', fontSize: '0.82rem', lineHeight: 1.65, marginTop: 6 }}>{exp.summary}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#431407', marginBottom: 28 }}>Selected Work</h2>
          {sections.projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sections.projects.map((project, i) => (
                <CanvasProjectCard key={i} project={project} />
              ))}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#fcd9bd' }}>No projects added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* SKILLS — Designer tool brand cards + other skills */}
      <section id="skills" style={{ background: '#fff', borderTop: '1px solid #fed7aa' }} className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#431407', marginBottom: 8 }}>Tools & Skills</h2>
          <p style={{ color: '#c2410c', fontSize: '0.85rem', marginBottom: 28 }}>The tools I create with every day</p>

          {designerTools.length > 0 && (
            <>
              <p style={{ fontSize: '0.68rem', color: '#c2410c', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>DESIGN TOOLS</p>
              <div className="mb-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {designerTools.map((skill) => (
                  <DesignerToolCard key={skill} skill={skill} />
                ))}
              </div>
            </>
          )}

          {otherSkills.length > 0 && (
            <>
              <p style={{ fontSize: '0.68rem', color: '#c2410c', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>OTHER SKILLS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {otherSkills.map((skill) => (
                  <RegularSkillBadge key={skill} skill={skill} />
                ))}
              </div>
            </>
          )}

          {sections.skills.length === 0 && (
            <p style={{ color: '#fcd9bd' }}>No skills listed yet.</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#431407', marginBottom: 8 }}>Let's Create Together</h2>
          <p style={{ color: '#9a3412', fontSize: '0.88rem', marginBottom: 32 }}>
            {sections.contact || 'Have a project in mind? I\'d love to hear about it.'}
          </p>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
            <div>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} style={{ display: 'block', color: '#f97316', fontWeight: 600, fontSize: '0.875rem', marginBottom: 16 }} className="transition hover:opacity-70">
                  {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {socialLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#c2410c', fontSize: '0.82rem' }} className="transition hover:text-orange-500">
                      {link.label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 16, padding: 24 }}>
              <ContactForm
                recipientEmail={contactEmail}
                theme={{
                  labelClassName: 'mb-1.5 block text-xs font-medium text-orange-700 uppercase tracking-wide',
                  inputClassName: 'w-full rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 text-sm text-orange-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100',
                  textareaClassName: 'w-full rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 text-sm text-orange-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100',
                  buttonClassName: 'inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-400 disabled:opacity-60',
                  successClassName: 'rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700',
                  errorClassName: 'mt-1 text-xs text-rose-500',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #fed7aa', background: '#fff' }} className="px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p style={{ color: '#fcd9bd', fontSize: '0.78rem' }}>© {new Date().getFullYear()} {name}</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {socialLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#fcd9bd', fontSize: '0.78rem' }} className="transition hover:text-orange-400">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
