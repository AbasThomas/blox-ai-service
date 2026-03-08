'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';
import { SmoothScroll } from './shared/SmoothScroll';

interface BentoStudioTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

// ── icons ─────────────────────────────────────────────────────────────────────

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconArrowUpRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ── carousel ──────────────────────────────────────────────────────────────────

interface Slide {
  imgUrl: string;
  title: string;
  url?: string;
}

function Carousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const count = slides.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [count, next]);

  if (count === 0) {
    return (
      <div className="relative flex h-[600px] w-full items-center justify-center rounded-3xl bg-neutral-100">
        <p className="text-sm text-neutral-400">No project images yet.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-neutral-100 h-[600px] w-full">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-500 ease-out"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.imgUrl} alt={slide.title} className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
        </div>
      ))}

      {/* Prev */}
      {count > 1 && (
        <button
          type="button"
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900/70 text-white transition hover:bg-neutral-900"
          aria-label="Previous slide"
        >
          <IconChevronLeft />
        </button>
      )}

      {/* Next */}
      {count > 1 && (
        <button
          type="button"
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900/70 text-white transition hover:bg-neutral-900"
          aria-label="Next slide"
        >
          <IconChevronRight />
        </button>
      )}

      {/* View Project CTA */}
      {slides[current]?.url && (
        <div className="absolute left-4 bottom-4">
          <a
            href={slides[current].url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 backdrop-blur transition hover:bg-white"
          >
            View Project
            <IconArrowUpRight />
          </a>
        </div>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="h-2.5 w-2.5 rounded-full transition"
              style={{ background: i === current ? 'white' : 'rgba(255,255,255,0.5)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── link icon helper ──────────────────────────────────────────────────────────

function SocialIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes('instagram')) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
  if (l.includes('twitter') || l.includes('x.com')) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
  if (l.includes('behance')) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
  if (l.includes('dribbble')) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
      <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
      <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
    </svg>
  );
  if (l.includes('linkedin')) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
  if (l.includes('github')) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
  return <IconLink />;
}

// ── main component ────────────────────────────────────────────────────────────

export function BentoStudioTemplate({ profile }: BentoStudioTemplateProps) {
  const { sections, user } = profile;

  const name = user.fullName || 'Studio';
  // Split name: first word(s) as main, last word as studio suffix
  const nameParts = name.trim().split(/\s+/);
  const studioSuffix = nameParts.length > 1 ? nameParts.pop() : 'Studio';
  const mainName = nameParts.join(' ');

  const headline = user.headline || 'Creative Studio';
  const about =
    sections.about ||
    sections.hero?.body ||
    'We capture authentic moments and craft visual stories blending clean minimalism with soft emotion—every frame composed with intention.';

  // Build carousel slides from projects
  const slides: Slide[] = sections.projects
    .map((p) => {
      const imgUrl = p.snapshotUrl || p.imageUrl || p.images?.[0]?.url || '';
      if (!imgUrl) return null;
      return { imgUrl, title: p.title, url: p.url };
    })
    .filter((s): s is Slide => s !== null);

  // Decorative aside background — avatar or first project image
  const asideBgImg =
    user.avatarUrl ||
    sections.projects[0]?.snapshotUrl ||
    sections.projects[0]?.imageUrl ||
    sections.projects[0]?.images?.[0]?.url ||
    '';

  // Social links (http only, exclude contact/email)
  const socialLinks = sections.links.filter((l) => l.url.startsWith('http'));

  // Contact email
  const contactEmail = (() => {
    const link = sections.links.find(
      (l) => l.kind === 'contact' || l.url.startsWith('mailto:') || l.label.toLowerCase().includes('email'),
    );
    return link?.url.replace('mailto:', '') ?? '';
  })();

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main style={{ background: '#f5f5f5', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <SmoothScroll />

      {/* ── HERO ── */}
      <section id="hero" className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-white rounded-3xl px-4 pt-4 pb-4">
          <h1 className="py-6 font-light leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 7rem)' }}>
            {mainName}{' '}
            <span className="text-neutral-400 font-light">{studioSuffix}</span>
          </h1>
        </div>
      </section>

      {/* ── MAIN BENTO ── */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Carousel */}
          <div className="lg:col-span-2 flex">
            <Carousel slides={slides} />
          </div>

          {/* Right: Aside */}
          <aside className="flex flex-col space-y-4" style={{ height: 600 }}>

            {/* Profile card */}
            <div className="ring-1 ring-neutral-200 bg-white rounded-3xl p-5 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">{name}</h2>
              <p className="text-sm text-neutral-500 mt-0.5">{headline}</p>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{about}</p>
            </div>

            {/* Decorative image block */}
            <div
              className="rounded-3xl flex-1 min-h-0 shadow-sm ring-1 ring-neutral-200"
              style={{
                backgroundImage: asideBgImg ? `url(${asideBgImg})` : undefined,
                background: asideBgImg ? undefined : 'linear-gradient(135deg,#e5e7eb,#d1d5db)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: 120,
              }}
            />

            {/* Social + contact links */}
            <div className="space-y-2.5">
              {socialLinks.slice(0, 3).map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ring-neutral-200 bg-white transition hover:bg-neutral-50"
                >
                  <span className="text-sm font-medium text-neutral-800">{link.label}</span>
                  <span className="text-neutral-400">
                    <SocialIcon label={link.label} />
                  </span>
                </a>
              ))}

              {/* Contact CTA */}
              <button
                type="button"
                onClick={scrollToContact}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 bg-neutral-900 transition hover:bg-black"
              >
                <span className="text-sm font-medium text-white">Contact Me</span>
                <span className="text-white">
                  <IconMail />
                </span>
              </button>

              {/* Resume download */}
              {profile.resumeAssetId && (
                <ResumeDownloadButton
                  subdomain={subdomain}
                  ownerName={name}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 ring-1 ring-neutral-200 bg-white transition hover:bg-neutral-50 text-sm font-medium text-neutral-800"
                />
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* ── PROJECTS GRID ── */}
      {sections.projects.length > 0 && (
        <section id="projects" className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sections.projects.map((project, i) => {
                const img = project.snapshotUrl || project.imageUrl || project.images?.[0]?.url;
                return (
                  <article
                    key={i}
                    className="rounded-2xl overflow-hidden bg-neutral-50 ring-1 ring-neutral-200"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={project.title} className="w-full aspect-video object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-video bg-neutral-100 flex items-center justify-center">
                        <span className="text-xs text-neutral-400">{project.title}</span>
                      </div>
                    )}
                    <div className="p-4">
                      {project.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs text-neutral-400 mr-2">{tag}</span>
                      ))}
                      <h3 className="text-sm font-semibold text-neutral-800 mt-1">{project.title}</h3>
                      {project.description && (
                        <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 mt-3 transition hover:text-neutral-900"
                        >
                          View Project <IconArrowUpRight />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT + SKILLS ── */}
      {(sections.about || sections.skills.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sections.about && (
              <div className="bg-white rounded-3xl p-6 ring-1 ring-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900 mb-3">About</h2>
                <p className="text-sm leading-7 text-neutral-600">{sections.about}</p>
                {sections.experience.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-xs font-medium text-neutral-400 tracking-wider">Experience</h3>
                    {sections.experience.map((exp, i) => (
                      <div key={i} className="border-b border-neutral-100 pb-3 last:border-0">
                        <p className="text-sm font-semibold text-neutral-800">{exp.role}</p>
                        {exp.company && <p className="text-xs text-neutral-500 mt-0.5">{exp.company}</p>}
                        {exp.period && <p className="text-xs text-neutral-400 mt-0.5">{exp.period}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {sections.skills.length > 0 && (
              <div className="bg-white rounded-3xl p-6 ring-1 ring-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {sections.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium text-neutral-700 bg-neutral-100 rounded-full px-3 py-1.5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      <section id="contact" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-3xl p-6 ring-1 ring-neutral-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-3">Get in Touch</h2>
              <p className="text-sm leading-7 text-neutral-600">
                {sections.contact || 'Always open to interesting conversations and collaborations.'}
              </p>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-neutral-900 transition hover:opacity-70"
                >
                  <IconMail /> {contactEmail}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-5 space-y-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-800"
                    >
                      <SocialIcon label={link.label} /> {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <ContactForm
              recipientEmail={contactEmail}
              theme={{
                formClassName: 'space-y-4',
                labelClassName: 'mb-1.5 block text-xs font-medium text-neutral-500',
                inputClassName:
                  'w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100',
                textareaClassName:
                  'w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100',
                buttonClassName:
                  'inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60',
                successClassName: 'rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-700',
                errorClassName: 'mt-1 text-xs text-rose-500',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-6">
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} {name}</p>
          <div className="flex gap-5">
            {socialLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
                className="text-xs text-neutral-400 transition hover:text-neutral-700">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
