import type { ReactNode } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

type HeaderProps = {
  searchSlot?: ReactNode;
  compareTraySlot?: ReactNode;
  navSlot?: ReactNode;
};

export function Header({ searchSlot, compareTraySlot, navSlot }: HeaderProps) {
  const showTools = Boolean(searchSlot || compareTraySlot);

  return (
    <header className="terminal-surface overflow-hidden p-0">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-[0.18em] text-terminal-text">GREENTRUST INTELLIGENCE TERMINAL</h1>
              <span className="text-xs text-terminal-text-muted">v3.0.0</span>
              <span className="inline-flex items-center gap-1 text-xs text-terminal-green">
                <span className="h-1.5 w-1.5 rounded-full bg-terminal-green" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-terminal-text-muted md:tracking-wide">Live risk, evidence, document, and verification command center</p>
            {navSlot ? <div className="mt-2">{navSlot}</div> : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[360px]">
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <AnimatedThemeToggler aria-label="Toggle theme" />
            </div>
          </div>
          {showTools ? (
            <>
              {searchSlot}
              {compareTraySlot}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
