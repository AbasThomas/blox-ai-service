'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { templatesApi, billingApi } from '@/lib/api';

interface Listing {
  id: string;
  priceMinor: number;
  currency: string;
  template: {
    id: string;
    name: string;
    category: string;
    description: string;
    previewUrl?: string;
    rating: number;
    forkCount: number;
  };
  seller?: { fullName: string };
}

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    templatesApi.listMarketplace()
      .then((data) => setListings(data as Listing[]))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((l) =>
    !search || l.template.name.toLowerCase().includes(search.toLowerCase()) ||
    l.template.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleBuy = async (listing: Listing) => {
    setBuying(listing.id);
    try {
      const checkout = await billingApi.createCheckout({
        templateListingId: listing.id,
        currency: listing.currency,
      }) as { authorizationUrl: string };
      window.location.href = checkout.authorizationUrl;
    } catch { /* ignore */ }
    finally { setBuying(null); }
  };

  const formatPrice = (minor: number, currency: string) => {
    const major = minor / 100;
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  };

  return (
    <FeaturePage title="Template marketplace" description="Buy premium templates or sell your own. 80% revenue to creators.">
      <div className="flex flex-col gap-4 sm:flex-row mb-6 items-start">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search marketplace templates..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <a href="/templates"
          className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Browse free templates
        </a>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-60 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          <p className="text-4xl mb-2">🛒</p>
          <p className="text-sm">{search ? 'No results found.' : 'No listings yet. Check back soon!'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <article key={listing.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center relative">
                {listing.template.previewUrl ? (
                  <img src={listing.template.previewUrl} alt={listing.template.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl">
                    {listing.template.category === 'PORTFOLIO' ? '🎨' : listing.template.category === 'RESUME' ? '📄' : '✉️'}
                  </span>
                )}
                <span className="absolute top-2 right-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                  {formatPrice(listing.priceMinor, listing.currency)}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-sm text-slate-900 leading-tight">{listing.template.name}</h3>
                  <span className="ml-2 shrink-0 text-xs text-amber-500 font-medium">★ {listing.template.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1 line-clamp-2">{listing.template.description}</p>
                {listing.seller && (
                  <p className="text-xs text-slate-400 mb-3">by {listing.seller.fullName}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{listing.template.forkCount} uses</span>
                  <button onClick={() => handleBuy(listing)} disabled={buying === listing.id}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                    {buying === listing.id ? '...' : 'Buy'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Sell panel */}
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center">
        <h3 className="text-base font-bold text-slate-900 mb-1">Sell your templates</h3>
        <p className="text-sm text-slate-600 mb-4">Earn 80% of each sale. Blox handles payments, delivery, and updates.</p>
        <button onClick={() => router.push('/templates')}
          className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
          Manage your templates
        </button>
      </div>
    </FeaturePage>
  );
}
