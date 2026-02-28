export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900" role="alert">
      <h2 className="text-lg font-bold">Something went wrong</h2>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

