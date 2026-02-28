import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-3xl font-black">Page not found</h1>
      <p className="text-sm text-slate-600">
        We could not find that page. Try searching templates or jump back to dashboard.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/dashboard" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Go to dashboard
        </Link>
        <Link href="/templates" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
          Browse templates
        </Link>
      </div>
    </section>
  );
}

