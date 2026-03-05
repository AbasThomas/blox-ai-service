'use client';

import { useEffect, useMemo, useState } from 'react';

interface NavItem {
  label: string;
  href: string;
}

interface PortfolioNavProps {
  brand: string;
  items: NavItem[];
  className?: string;
  brandClassName?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
  mobilePanelClassName?: string;
}

const DEFAULT_LINK_CLASS =
  'rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60';
const DEFAULT_ACTIVE_LINK_CLASS = 'text-slate-100 underline underline-offset-4';

export function PortfolioNav({
  brand,
  items,
  className = '',
  brandClassName = '',
  linkClassName = DEFAULT_LINK_CLASS,
  activeLinkClassName = DEFAULT_ACTIVE_LINK_CLASS,
  mobilePanelClassName = '',
}: PortfolioNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('#hero');

  const sectionIds = useMemo(
    () => items.map((item) => item.href.replace('#', '')).filter(Boolean),
    [items],
  );

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveHref(`#${visible[0].target.id}`);
        }
      },
      {
        threshold: [0.35, 0.55, 0.8],
        rootMargin: '-96px 0px -40% 0px',
      },
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => !!element);

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionIds]);

  const goTo = (href: string) => {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
      setActiveHref(href);
    }
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-current/10 backdrop-blur ${className}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => goTo('#hero')}
          className={`text-sm font-semibold ${brandClassName}`}
          aria-label="Go to top"
        >
          {brand}
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Internal section navigation">
          {items.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => goTo(item.href)}
              className={`${linkClassName} ${activeHref === item.href ? activeLinkClassName : ''}`}
              aria-current={activeHref === item.href ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((previous) => !previous)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-current/15 text-sm md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="portfolio-mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {mobileOpen ? (
        <nav
          id="portfolio-mobile-nav"
          className={`border-t border-current/10 p-3 md:hidden ${mobilePanelClassName}`}
          aria-label="Mobile section navigation"
        >
          <div className="grid gap-1">
            {items.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => goTo(item.href)}
                className={`rounded-lg px-3 py-2 text-left text-sm ${linkClassName} ${
                  activeHref === item.href ? activeLinkClassName : ''
                }`}
                aria-current={activeHref === item.href ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
