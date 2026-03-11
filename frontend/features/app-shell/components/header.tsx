import type { ReactNode } from "react";

type HeaderProps = {
  searchSlot?: ReactNode;
  compareTraySlot?: ReactNode;
};

export function Header({ searchSlot, compareTraySlot }: HeaderProps) {
  return (
    <header className="terminal-surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-terminal-green">GreenTrust</h1>
        <p className="text-xs text-terminal-text-muted">Sustainable finance intelligence</p>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[360px]">
        {searchSlot ?? (
          <div className="rounded-md border border-terminal-border bg-terminal-bg/70 px-3 py-2 text-sm text-terminal-text-dim">
            Search slot (Phase 1 scaffold)
          </div>
        )}
        {compareTraySlot ?? (
          <div className="rounded-md border border-terminal-border bg-terminal-bg/70 px-3 py-2 text-sm text-terminal-text-dim">
            Compare tray slot (Phase 1 scaffold)
          </div>
        )}
      </div>
    </header>
  );
}
