import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('skeleton block rounded-md', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col gap-2.5 p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="mt-1 h-9 w-full rounded-lg" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="card divide-y divide-ink-100">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
