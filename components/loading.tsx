import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

// Legacy component for backward compatibility
const LegacyLoadingSkeleton = () => (
  <div className="flex flex-col">
    {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-6 w-48" />
    </header> */}

    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <TableSkeleton rows={5} />
      </div>
    </div>
  </div>
);

export default LegacyLoadingSkeleton;
