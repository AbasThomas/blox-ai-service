import Image from 'next/image';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm, type ContactFormTheme } from './ContactForm';
import { PortfolioNav } from './PortfolioNav';
import { ProjectGalleryCard } from './ProjectGalleryCard';
import { detectSkillPersona, SkillBadge } from './SkillBadge';
import { SmoothScroll } from './SmoothScroll';
import { FadeIn, FadeInGroup, FadeInItem } from './FadeIn';
import { ExperienceTimeline } from './ExperienceTimeline';

export interface PortfolioThemeConfig {
  rootClassName: string;
  navClassName: string;
  navBrandClassName: string;
  navLinkClassName: string;
  navActiveLinkClassName: string;
  heroTitleClassName: string;
  heroBodyClassName: string;
  heroPanelClassName: string;
  sectionClassName: string;
  sectionTitleClassName: string;
  panelClassName: string;
  mutedTextClassName: string;
  accentTextClassName: string;
  primaryButtonClassName: string;
  secondaryButtonClassName: string;
  projectCardClassName: string;
  footerClassName: string;
  footerLinkClassName: string;
  skillChipClassName: string;
  projectLinkClassName: string;
  projectTagClassName: string;
  contactTheme: ContactFormTheme;
  /** Optional: timeline dot/line color overrides */
  timelineAccentColor?: string;
  timelineLineColor?: string;
  timelineCardBg?: string;
}

interface PortfolioTemplateScaffoldProps {
  profile: PublicProfilePayload;
  subdomain: string;
  theme: PortfolioThemeConfig;
}

function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

function getContactEmail(profile: PublicProfilePayload) {
  const contactLink = profile.sections.links.find(
    (link) =>
      link.kind === 'contact' ||
      link.url.startsWith('mailto:') ||
      link.label.toLowerCase().includes('email'),
  );
  return contactLink?.url.replace('mailto:', '') ?? '';
}

function profileName(profile: PublicProfilePayload) {
  return profile.user?.fullName || 'Portfolio Owner';
}

function socialLinks(profile: PublicProfilePayload) {
  return profile.sections.links.filter(
    (link) => link.url.startsWith('http://') || link.url.startsWith('https://'),
  );
}

function navItems() {
  return [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ];
}

export function PortfolioTemplateScaffold({
  profile,
  subdomain,
  theme,
}: PortfolioTemplateScaffoldProps) {
  const { sections, user } = profile;
  const person = profileName(profile);
  const contactEmail = getContactEmail(profile);
  const links = socialLinks(profile);
  const skillsPersona = detectSkillPersona(sections.skills);

  return (
    <main className={theme.rootClassName}>
      <SmoothScroll />
      <PortfolioNav
        brand={person}
        items={navItems()}
        className={theme.navClassName}
        brandClassName={theme.navBrandClassName}
        linkClassName={theme.navLinkClassName}
        activeLinkClassName={theme.navActiveLinkClassName}
        mobilePanelClassName={theme.navClassName}
      />

      {/* HERO */}
      <section id="hero" className="relative flex min-h-screen items-center px-4 pt-28 pb-16 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-6">
            <h1 className={theme.heroTitleClassName}>{sections.hero.heading || person}</h1>
            <p className={theme.heroBodyClassName}>
              {sections.hero.body || sections.about || 'A portfolio experience built with Blox.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#projects" className={theme.primaryButtonClassName}>
                View projects
              </a>
              <a href="#contact" className={theme.secondaryButtonClassName}>
                Contact
              </a>
            </div>
          </div>

          <div className={`rounded-3xl p-6 ${theme.heroPanelClassName}`}>
            <div className="space-y-4">
              <div className="mx-auto h-40 w-40 overflow-hidden rounded-2xl border border-current/10">
                {user?.avatarUrl ? (
                  isDataUrl(user.avatarUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={person}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Image
                      src={user.avatarUrl}
                      alt={person}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
                    {person.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold">{person}</p>
                {profile.user?.headline ? (
                  <p className={theme.mutedTextClassName}>{profile.user.headline}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className={`${theme.sectionClassName} px-4 py-20 sm:px-6`}>
        <div className="mx-auto max-w-6xl space-y-8">
          <FadeIn>
            <h2 className={theme.sectionTitleClassName}>About</h2>
          </FadeIn>
          <div className={`grid gap-6 lg:grid-cols-2 ${theme.panelClassName}`}>
            <FadeIn delay={0.05}>
              <p className="text-base leading-8">
                {sections.about || sections.hero.body || 'Professional summary coming soon.'}
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Experience highlights</h3>
                {sections.experience.length > 0 ? (
                  <ExperienceTimeline
                    items={sections.experience}
                    accentColor={theme.timelineAccentColor}
                    lineColor={theme.timelineLineColor}
                    cardBg={theme.timelineCardBg}
                  />
                ) : (
                  <p className={theme.mutedTextClassName}>
                    Experience entries have not been added yet.
                  </p>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className={`${theme.sectionClassName} px-4 py-20 sm:px-6`}>
        <div className="mx-auto max-w-6xl space-y-8">
          <FadeIn>
            <h2 className={theme.sectionTitleClassName}>Projects</h2>
          </FadeIn>
          {sections.projects.length > 0 ? (
            <FadeInGroup className="grid gap-6 sm:grid-cols-2">
              {sections.projects.map((project, index) => (
                <FadeInItem key={`${project.title}-${index}`}>
                  <ProjectGalleryCard
                    project={project}
                    cardClassName={theme.projectCardClassName}
                    titleClassName="text-xl font-semibold"
                    textClassName={theme.mutedTextClassName}
                    tagClassName={theme.projectTagClassName}
                    linkClassName={theme.projectLinkClassName}
                    buttonClassName={theme.secondaryButtonClassName}
                    accentClassName={theme.accentTextClassName}
                  />
                </FadeInItem>
              ))}
            </FadeInGroup>
          ) : (
            <FadeIn>
              <div className={`rounded-2xl p-6 ${theme.panelClassName}`}>
                <p className={theme.mutedTextClassName}>
                  Projects will appear here once they are added in the editor.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className={`${theme.sectionClassName} px-4 py-20 sm:px-6`}>
        <div className="mx-auto max-w-6xl space-y-8">
          <FadeIn>
            <h2 className={theme.sectionTitleClassName}>Skills</h2>
          </FadeIn>
          {sections.skills.length > 0 ? (
            <FadeInGroup className="flex flex-wrap gap-3">
              {sections.skills.map((skill) => (
                <FadeInItem key={skill}>
                  <SkillBadge
                    skill={skill}
                    persona={skillsPersona}
                    className={theme.skillChipClassName}
                  />
                </FadeInItem>
              ))}
            </FadeInGroup>
          ) : (
            <FadeIn>
              <div className={`rounded-2xl p-6 ${theme.panelClassName}`}>
                <p className={theme.mutedTextClassName}>
                  Add skills to highlight your capabilities here.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className={`${theme.sectionClassName} px-4 py-20 sm:px-6`}>
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1.1fr]">
          <FadeIn delay={0.05}>
            <div className={`rounded-2xl p-6 ${theme.panelClassName}`}>
              <h2 className={theme.sectionTitleClassName}>Contact</h2>
              <p className={`${theme.mutedTextClassName} mt-3 text-base leading-7`}>
                {sections.contact || 'Interested in collaboration? Send a message and I will reply soon.'}
              </p>
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className={`mt-4 inline-flex text-sm font-semibold ${theme.accentTextClassName}`}
                >
                  {contactEmail}
                </a>
              ) : null}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className={`rounded-2xl p-6 ${theme.panelClassName}`}>
              <ContactForm recipientEmail={contactEmail} theme={theme.contactTheme} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`px-4 py-8 sm:px-6 ${theme.footerClassName}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className={theme.mutedTextClassName}>
            Copyright {new Date().getFullYear()} {person}
          </p>
          <div className="flex flex-wrap gap-4">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className={theme.footerLinkClassName}
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
