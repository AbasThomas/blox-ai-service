import { mapAssetToPublicProfile } from './public-profile.mapper';

describe('mapAssetToPublicProfile', () => {
  const baseAsset = {
    id: 'asset-1',
    userId: 'user-1',
    type: 'PORTFOLIO',
    title: 'Design Portfolio',
    slug: 'design-portfolio',
    healthScore: 80,
    visibility: 'PUBLIC',
    passwordHash: null,
    expiresAt: null,
    seoConfig: null,
    content: {
      hero: { heading: 'Alicia Stone', body: 'Product designer and front-end builder.' },
      about: { body: 'Focused on SaaS UX and conversion flows.' },
      projects: { items: ['Pricing Redesign', 'Onboarding Revamp'] },
      skills: { items: ['Figma', 'TypeScript'] },
      links: [{ label: 'GitHub', url: 'https://github.com/alicia' }],
      contact: { body: 'Reach me at https://aliciastone.dev/contact' },
    },
    publishedUrl: 'https://alicia.blox.app',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
  };

  it('maps typed content to a public profile payload', () => {
    const payload = mapAssetToPublicProfile({
      subdomain: 'alicia',
      asset: {
        ...baseAsset,
        user: { fullName: 'Alicia Stone' },
      },
    });

    expect(payload.subdomain).toBe('alicia');
    expect(payload.sections.hero.heading).toBe('Alicia Stone');
    expect(payload.sections.projects).toHaveLength(2);
    expect(payload.sections.skills).toEqual(['Figma', 'TypeScript']);
    expect(payload.sections.links[0]?.url).toBe('https://github.com/alicia');
    expect(payload.seo.title.length).toBeGreaterThan(5);
  });

  it('falls back to extracted links and defaults when seo is missing', () => {
    const payload = mapAssetToPublicProfile({
      subdomain: 'alicia',
      asset: {
        ...baseAsset,
        content: {
          sections: [{ type: 'hero', content: 'Alicia Stone portfolio' }],
          contact: { body: 'Book call: https://example.com/call' },
        },
        seoConfig: {},
        user: { fullName: 'Alicia Stone' },
      },
    });

    expect(payload.sections.links).toHaveLength(1);
    expect(payload.sections.links[0]?.url).toBe('https://example.com/call');
    expect(payload.seo.description.length).toBeGreaterThan(5);
    expect(payload.seo.ogImageUrl).toContain('dummyimage.com');
  });
});
