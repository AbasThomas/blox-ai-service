'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { SmoothScroll } from './shared/SmoothScroll';
import { getSkillIconData } from './shared/SkillBadge';

interface StudioDesignerTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

function isDataUrl(v: string) {
  return v.startsWith('data:');
}

// Designer tool brand color map
const TOOL_BRAND: Record<string, { bg: string; text: string; label?: string }> = {
  figma: { bg: '#F24E1E', text: '#fff' },
  'adobe photoshop': { bg: '#31A8FF', text: '#fff', label: 'Photoshop' },
  photoshop: { bg: '#31A8FF', text: '#fff', label: 'Photoshop' },
  'adobe illustrator': { bg: '#FF9A00', text: '#fff', label: 'Illustrator' },
  illustrator: { bg: '#FF9A00', text: '#fff', label: 'Illustrator' },
  'premiere pro': { bg: '#9999FF', text: '#fff', label: 'Premiere' },
  premiere: { bg: '#9999FF', text: '#fff', label: 'Premiere' },
  'adobe premiere': { bg: '#9999FF', text: '#fff', label: 'Premiere' },
  'after effects': { bg: '#9999FF', text: '#fff', label: 'After Effects' },
  aftereffects: { bg: '#9999FF', text: '#fff', label: 'After Effects' },
  'adobe after effects': { bg: '#9999FF', text: '#fff', label: 'After Effects' },
  'adobe indesign': { bg: '#FF3366', text: '#fff', label: 'InDesign' },
  indesign: { bg: '#FF3366', text: '#fff', label: 'InDesign' },
  lightroom: { bg: '#31A8FF', text: '#fff', label: 'Lightroom' },
  'adobe lightroom': { bg: '#31A8FF', text: '#fff', label: 'Lightroom' },
  'adobe xd': { bg: '#FF61F6', text: '#fff', label: 'Adobe XD' },
  xd: { bg: '#FF61F6', text: '#fff', label: 'Adobe XD' },
  canva: { bg: '#00C4CC', text: '#fff' },
  blender: { bg: '#E87D0D', text: '#fff' },
  sketch: { bg: '#F7B500', text: '#1a1a1a' },
  framer: { bg: '#0055FF', text: '#fff' },
  webflow: { bg: '#4353FF', text: '#fff' },
  'affinity photo': { bg: '#7E4DD2', text: '#fff', label: 'Affinity Photo' },
  'affinity designer': { bg: '#1B72BE', text: '#fff', label: 'Affinity Designer' },
  gimp: { bg: '#5C5543', text: '#fff' },
  inkscape: { bg: '#3d3d3d', text: '#fff' },
  coreldraw: { bg: '#008200', text: '#fff', label: 'CorelDRAW' },
  'corel draw': { bg: '#008200', text: '#fff', label: 'CorelDRAW' },
  procreate: { bg: '#1c1c1e', text: '#fff' },
  'cinema 4d': { bg: '#011A6A', text: '#fff', label: 'Cinema 4D' },
  c4d: { bg: '#011A6A', text: '#fff', label: 'Cinema 4D' },
  maya: { bg: '#0078D4', text: '#fff' },
};

function isDesignerTool(skill: string) {
  return skill.toLowerCase().trim() in TOOL_BRAND;
}

function getToolBrand(skill: string) {
  const key = skill.toLowerCase().trim();
  return TOOL_BRAND[key] ?? { bg: '#a855f7', text: '#fff' };
}

function StudioAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (!url) {
    return (
      <div style={{ width: 100, height: 100, background: 'rgba(168,85,247,0.1)', border: '2px solid rgba(168,85,247,0.3)' }} className="flex items-center justify-center rounded-full text-3xl font-bold text-purple-400">
        {initials}
      </div>
    );
  }
  if (isDataUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: 100, height: 100 }} className="rounded-full object-cover" loading="lazy" />
    );
  }
  return <Image src={url} alt={name} width={100} height={100} className="rounded-full object-cover" />;
}

function CaseStudyCard({ project, index }: { project: PublicProfilePayload['sections']['projects'][number]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
  const accentColors = ['#a855f7', '#e879f9', '#818cf8', '#c084fc', '#f0abfc'];
  const accent = accentColors[index % accentColors.length];

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0f0f1a',
        border: `1px solid ${hovered ? accent + '40' : 'rgba(168,85,247,0.12)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.25s',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}18, ${accent}08)` }} className="flex items-center justify-center">
            <span style={{ color: accent + '40', fontSize: '2rem', fontWeight: 900 }}>
              {project.title.slice(0, 1)}
            </span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, #080812 0%, transparent 60%)` }} />
      </div>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>{project.title}</h3>
          {project.tags && project.tags[0] && (
            <span style={{ background: accent + '20', border: `1px solid ${accent}40`, color: accent, fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
              {project.tags[0]}
            </span>
          )}
        </div>
        {project.description && (
          <p style={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.65 }}>{project.description}</p>
        )}
        {project.caseStudy && (
          <p style={{ color: '#334155', fontSize: '0.78rem', lineHeight: 1.6, marginTop: 8, fontStyle: 'italic' }}>
            {project.caseStudy.slice(0, 120)}{project.caseStudy.length > 120 ? '...' : ''}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {project.tags?.slice(1).map((tag) => (
            <span key={tag} style={{ color: '#334155', fontSize: '0.68rem', border: '1px solid rgba(168,85,247,0.15)', padding: '2px 7px', borderRadius: 4 }}>
              {tag}
            </span>
          ))}
        </div>
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, color: accent, fontSize: '0.78rem', fontWeight: 600 }} className="transition hover:opacity-70">
            View case study →
          </a>
        )}
      </div>
    </article>
  );
}

const NAV_ITEMS = ['about', 'work', 'tools', 'contact'];
const SECTION_MAP: Record<string, string> = { work: 'projects', tools: 'skills' };

export function StudioDesignerTemplate({ profile }: StudioDesignerTemplateProps) {
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
    <main style={{ background: '#080812', color: '#e2e8f0', fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      <SmoothScroll />

      {/* MINIMAL NAV — just name + contact */}
      <header style={{ background: 'rgba(8,8,18,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(168,85,247,0.1)' }} className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-6 py-3.5">
          <button type="button" onClick={() => scrollTo('hero')} style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
            {name}
            <span style={{ color: '#a855f7', marginLeft: 2 }}>.</span>
          </button>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  color: active === (SECTION_MAP[id] ?? id) ? '#c084fc' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: active === (SECTION_MAP[id] ?? id) ? 500 : 400,
                  transition: 'color 0.2s',
                }}
                className="capitalize"
              >
                {id}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc', fontSize: '0.78rem', fontWeight: 600, padding: '6px 16px', borderRadius: 8 }} className="hidden transition hover:bg-purple-500/20 md:inline-flex">
                Contact
              </a>
            )}
            <button type="button" onClick={() => setMobileOpen((p) => !p)} style={{ color: '#475569' }} className="md:hidden" aria-label="Toggle menu">
              {mobileOpen ? '✕' : '≡'}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ background: '#0f0f1a', borderTop: '1px solid rgba(168,85,247,0.1)', padding: '12px 24px' }} className="md:hidden">
            {NAV_ITEMS.map((id) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} style={{ color: active === (SECTION_MAP[id] ?? id) ? '#c084fc' : '#475569' }} className="block w-full py-2.5 text-left text-sm capitalize">
                {id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO — IMMERSIVE DARK */}
      <section id="hero" style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }} className="px-6 pt-20 pb-16">
        {/* Background gradient */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1fr_380px] lg:items-center">
          <div className="space-y-6">
            <StudioAvatar url={user.avatarUrl} name={name} />
            <div>
              <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                {sections.hero.heading || name}
              </h1>
              {user.headline && (
                <p style={{ color: '#a855f7', fontWeight: 500, fontSize: '1.05rem', marginTop: 12 }}>{user.headline}</p>
              )}
              <p style={{ color: '#475569', lineHeight: 1.85, marginTop: 14, maxWidth: '36rem', fontSize: '0.92rem' }}>
                {sections.hero.body || sections.about || 'Crafting purposeful design experiences that connect brands with people.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button type="button" onClick={() => scrollTo('work')} style={{ background: '#a855f7', color: '#fff', fontWeight: 700, fontSize: '0.875rem', borderRadius: 10, padding: '11px 26px' }} className="transition hover:bg-purple-400">
                View Work
              </button>
              <button type="button" onClick={() => scrollTo('contact')} style={{ border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', fontSize: '0.875rem', borderRadius: 10, padding: '11px 24px' }} className="transition hover:bg-purple-500/10">
                Say Hello
              </button>
            </div>
            {socialLinks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {socialLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#334155', fontSize: '0.78rem' }} className="transition hover:text-purple-400">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Work mosaic on the right */}
          {sections.projects.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {sections.projects.slice(0, 4).map((project, i) => {
                const imgUrl = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
                const accentColors = ['#a855f7', '#e879f9', '#818cf8', '#c084fc'];
                const accent = accentColors[i % accentColors.length];
                return (
                  <div key={i} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#0f0f1a', border: '1px solid rgba(168,85,247,0.1)' }}>
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}15, ${accent}05)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: accent + '40', fontWeight: 900, fontSize: '1.5rem' }}>{project.title.slice(0, 1)}</span>
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
      <section id="about" style={{ background: '#0c0c18', borderTop: '1px solid rgba(168,85,247,0.08)' }} className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2">
          <div>
            <p style={{ color: '#a855f7', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 12 }}>ABOUT</p>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#e2e8f0', marginBottom: 16, lineHeight: 1.2 }}>My Approach to Design</h2>
            <p style={{ color: '#475569', lineHeight: 1.85, fontSize: '0.92rem' }}>
              {sections.about || sections.hero.body || 'No biography available yet.'}
            </p>
          </div>
          {sections.experience.length > 0 && (
            <div className="space-y-4">
              {sections.experience.map((exp, i) => (
                <div key={i} style={{ background: '#0f0f1a', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{exp.role}</p>
                      {exp.company && <p style={{ color: '#a855f7', fontSize: '0.78rem', marginTop: 3 }}>{exp.company}</p>}
                    </div>
                    {exp.period && <span style={{ color: '#1e1b4b', fontSize: '0.7rem' }}>{exp.period}</span>}
                  </div>
                  {exp.summary && <p style={{ color: '#334155', fontSize: '0.8rem', lineHeight: 1.6, marginTop: 8 }}>{exp.summary}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROJECTS — CASE STUDY CARDS */}
      <section id="projects" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p style={{ color: '#a855f7', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 8 }}>SELECTED WORK</p>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#e2e8f0', marginBottom: 32 }}>Case Studies</h2>
          {sections.projects.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {sections.projects.map((project, i) => (
                <CaseStudyCard key={i} project={project} index={i} />
              ))}
            </div>
          ) : (
            <div style={{ background: '#0f0f1a', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#1e1b4b' }}>No projects added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* SKILLS — TWO-COL TOOL LIST WITH BRAND COLORS */}
      <section id="skills" style={{ background: '#0c0c18', borderTop: '1px solid rgba(168,85,247,0.08)' }} className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p style={{ color: '#a855f7', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 8 }}>EXPERTISE</p>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#e2e8f0', marginBottom: 32 }}>Tools & Skills</h2>

          {sections.skills.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sections.skills.map((skill) => {
                const { icon: Icon, colorClass, hex } = getSkillIconData(skill);
                const brand = isDesignerTool(skill) ? getToolBrand(skill) : null;

                return (
                  <div
                    key={skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#0f0f1a',
                      border: '1px solid rgba(168,85,247,0.1)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      transition: 'border-color 0.2s',
                    }}
                    className="group hover:border-purple-500/30"
                  >
                    {brand ? (
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ color: brand.text, width: 16, height: 16 }} aria-hidden />
                      </div>
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon className={`h-4 w-4 ${colorClass}`} aria-hidden />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>{skill}</p>
                      {brand && (
                        <p style={{ color: '#334155', fontSize: '0.68rem', marginTop: 1 }}>Design Tool</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#1e1b4b' }}>No skills listed yet.</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p style={{ color: '#a855f7', fontSize: '0.7rem', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 8 }}>GET IN TOUCH</p>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#e2e8f0', marginBottom: 8 }}>Let's Collaborate</h2>
          <p style={{ color: '#475569', fontSize: '0.88rem', marginBottom: 32 }}>
            {sections.contact || 'Open to design projects, brand identities, UI/UX work and creative collaborations.'}
          </p>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-4">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} style={{ display: 'block', color: '#a855f7', fontWeight: 600, fontSize: '0.875rem' }} className="transition hover:text-purple-300">
                  {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {socialLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#334155', fontSize: '0.82rem' }} className="transition hover:text-purple-400">
                      {link.label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: '#0f0f1a', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 16, padding: 24 }}>
              <ContactForm
                recipientEmail={contactEmail}
                theme={{
                  labelClassName: 'mb-1.5 block text-xs font-medium text-purple-900',
                  inputClassName: 'w-full rounded-xl border border-purple-900/50 bg-purple-950/30 px-4 py-3 text-sm text-purple-100 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10',
                  textareaClassName: 'w-full rounded-xl border border-purple-900/50 bg-purple-950/30 px-4 py-3 text-sm text-purple-100 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10',
                  buttonClassName: 'inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-60',
                  successClassName: 'rounded-xl border border-purple-500/20 bg-purple-950/40 p-4 text-sm text-purple-300',
                  errorClassName: 'mt-1 text-xs text-rose-400',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(168,85,247,0.08)', background: '#0c0c18' }} className="px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p style={{ color: '#1e1b4b', fontSize: '0.78rem' }}>© {new Date().getFullYear()} {name}</p>
          <p style={{ color: '#a855f7', fontSize: '0.72rem' }}>Built with Blox</p>
        </div>
      </footer>
    </main>
  );
}
