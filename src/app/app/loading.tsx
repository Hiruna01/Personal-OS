import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div
      className="loading-state"
      aria-label="Loading your workspace"
      role="status"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="module-grid">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
