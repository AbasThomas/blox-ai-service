'use client';

export default function FiveHundredPage() {
  return (
    <section className="space-y-3 rounded-2xl border border-red-300 bg-red-50 p-8 text-center">
      <h1 className="text-4xl font-black text-red-900">500</h1>
      <p className="text-sm text-red-800">Unexpected error. Retry the action or return to dashboard.</p>
      <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white">
        Retry
      </button>
    </section>
  );
}

