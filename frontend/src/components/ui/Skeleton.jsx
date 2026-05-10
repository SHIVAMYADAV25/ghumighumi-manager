import clsx from 'clsx';

export function Skeleton({ className }) {
  return <div className={clsx('skeleton rounded-lg', className)} />;
}

export function TripCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden">
      <Skeleton className="h-40 rounded-none rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        <p className="text-sand-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
