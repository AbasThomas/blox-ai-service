import { LoadingSkeleton } from '../components/shared/loading-skeleton';

export default function Loading() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <LoadingSkeleton lines={7} />
    </div>
  );
}

