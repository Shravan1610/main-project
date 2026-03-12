"use client";

export function PageLoadingSkeleton() {
  return (
    <div className="flex min-h-105 flex-col items-center justify-center gap-4 rounded-[1.6rem] border border-terminal-border bg-terminal-surface p-8">
      {/* Animated terminal-style spinner */}
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-terminal-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-t-2 border-terminal-cyan" />
      </div>

      <div className="space-y-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-terminal-text-dim">
          Loading Module
        </p>
        <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-terminal-border/40">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-terminal-cyan/60" />
        </div>
      </div>

      {/* Skeleton content blocks */}
      <div className="mt-4 w-full max-w-xl space-y-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-terminal-border/25" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-terminal-border/20" />
        <div className="h-16 animate-pulse rounded-lg bg-terminal-border/15" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-terminal-border/20" />
      </div>
    </div>
  );
}
