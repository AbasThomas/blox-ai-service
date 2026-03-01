'use client';

import { ErrorState } from '../components/shared/error-state';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ErrorState message={error.message} />
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Retry
      </button>
    </div>
  );
}

