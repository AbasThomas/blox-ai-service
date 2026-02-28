import { FeaturePage } from '@/components/shared/feature-page';

export default function PortfolioSlugPage({ params }: { params: { slug: string } }) {
  return (
    <FeaturePage title={`Published portfolio: ${params.slug}`} description="SSR-rendered public portfolio with SEO metadata and analytics tracking.">
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Hero section</h2>
        <p className="text-sm text-slate-600">Showcasing work, skills, and achievements for recruiters and clients.</p>
      </div>
    </FeaturePage>
  );
}

