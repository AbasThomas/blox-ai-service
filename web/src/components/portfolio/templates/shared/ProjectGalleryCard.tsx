'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { PublicProfileProjectItem } from '@nextjs-blox/shared-types';

interface ProjectImage {
  url: string;
  alt: string;
}

interface ProjectGalleryCardProps {
  project: PublicProfileProjectItem;
  accentClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
  textClassName?: string;
  tagClassName?: string;
  linkClassName?: string;
  buttonClassName?: string;
}

function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

function buildProjectImages(project: PublicProfileProjectItem): ProjectImage[] {
  const items: ProjectImage[] = [];
  const push = (url?: string, alt?: string) => {
    if (!url) return;
    const normalized = url.trim();
    if (!normalized || items.some((item) => item.url === normalized)) return;
    const label = alt?.trim() || `${project.title} snapshot ${items.length + 1}`;
    items.push({ url: normalized, alt: label });
  };

  push(project.snapshotUrl);
  push(project.imageUrl);
  for (const image of project.images ?? []) {
    push(image.url, image.alt);
  }

  return items;
}

function RenderProjectImage({
  image,
  priority = false,
}: {
  image: ProjectImage;
  priority?: boolean;
}) {
  if (isDataUrl(image.url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={image.alt}
        className="h-full w-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover"
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

export function ProjectGalleryCard({
  project,
  accentClassName = 'text-cyan-300',
  cardClassName = 'rounded-2xl border border-white/10 bg-white/5',
  titleClassName = 'text-xl font-semibold text-slate-100',
  textClassName = 'text-sm leading-6 text-slate-400',
  tagClassName = 'rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-slate-200',
  linkClassName = 'text-sm font-semibold text-cyan-300 transition hover:text-cyan-200',
  buttonClassName = 'inline-flex items-center rounded-lg border border-current/30 px-3 py-1.5 text-sm transition hover:bg-white/10',
}: ProjectGalleryCardProps) {
  const images = useMemo(() => buildProjectImages(project), [project]);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = images[activeIndex];

  return (
    <article className={`overflow-hidden ${cardClassName}`}>
      {images[0] ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <RenderProjectImage image={images[0]} priority />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-white/5 text-sm text-slate-500">
          Project preview unavailable
        </div>
      )}

      <div className="space-y-4 p-5">
        <div>
          <h3 className={titleClassName}>{project.title}</h3>
          {project.description ? <p className={textClassName}>{project.description}</p> : null}
        </div>

        {project.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className={tagClassName}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {project.url ? (
            <a href={project.url} target="_blank" rel="noreferrer" className={linkClassName}>
              Visit project
            </a>
          ) : null}
          {images.length > 1 ? (
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              className={`${buttonClassName} ${accentClassName}`}
              aria-expanded={expanded}
            >
              {expanded ? 'Hide gallery' : `Open gallery (${images.length})`}
            </button>
          ) : null}
        </div>

        {expanded && activeImage ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/10">
              <RenderProjectImage image={activeImage} />
            </div>
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 w-24 overflow-hidden rounded-md border transition ${
                    activeIndex === index
                      ? 'border-cyan-300/60'
                      : 'border-white/15 hover:border-white/30'
                  }`}
                  aria-label={`View project image ${index + 1}`}
                >
                  <RenderProjectImage image={image} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
