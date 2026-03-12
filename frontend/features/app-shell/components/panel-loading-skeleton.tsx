export function PanelLoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-terminal-border bg-terminal-surface">
      {/* Title bar skeleton */}
      <div className="flex items-center gap-3 border-b border-terminal-border bg-terminal-bg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-terminal-border/60" />
          <span className="h-3 w-3 animate-pulse rounded-full bg-terminal-border/60" />
          <span className="h-3 w-3 animate-pulse rounded-full bg-terminal-border/60" />
        </div>
        <div className="mx-auto h-3 w-28 animate-pulse rounded bg-terminal-border/40" />
        <div className="w-16" />
      </div>

      {/* Body skeleton */}
      <div className="space-y-4 p-4">
        <div className="h-3 w-3/4 animate-pulse rounded bg-terminal-border/30" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-terminal-border/30" />
        <div className="h-20 animate-pulse rounded-lg bg-terminal-border/20" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-terminal-border/30" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-terminal-border/30" />
        <div className="h-16 animate-pulse rounded-lg bg-terminal-border/20" />
      </div>
    </div>
  );
}
