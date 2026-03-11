import { Header } from "./header";
import type { ReactNode } from "react";

type AppShellProps = {
  mapSlot?: ReactNode;
  sidePanelSlot?: ReactNode;
  feedSlot?: ReactNode;
  searchSlot?: ReactNode;
  compareTraySlot?: ReactNode;
  layerControlsSlot?: ReactNode;
};

export function AppShell({
  mapSlot,
  sidePanelSlot,
  feedSlot,
  searchSlot,
  compareTraySlot,
  layerControlsSlot,
}: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col p-4 md:p-6">
      <Header searchSlot={searchSlot} compareTraySlot={compareTraySlot} />

      <section className="mt-4 grid flex-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="terminal-surface relative min-h-[420px] p-4">
          {layerControlsSlot ? <div className="absolute left-4 top-4 z-10">{layerControlsSlot}</div> : null}
          {mapSlot ?? (
            <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-terminal-text-dim">
              Map area (Phase 1 scaffold)
            </div>
          )}
        </div>

        <aside className="terminal-surface min-h-[420px] p-4">
          {sidePanelSlot ?? (
            <div className="text-sm text-terminal-text-dim">Insight panel (Phase 1 scaffold)</div>
          )}
        </aside>
      </section>

      <section className="terminal-surface mt-4 min-h-[160px] p-4">
        {feedSlot ?? <div className="text-sm text-terminal-text-dim">Feeds section (Phase 1 scaffold)</div>}
      </section>
    </main>
  );
}
