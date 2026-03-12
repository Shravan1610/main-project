import { Header } from "./header";
import { SiteFooter } from "./site-footer";
import { MacWindow } from "@/shared/components/mac-window";
import type { ReactNode } from "react";

type AppShellProps = {
  mapSlot?: ReactNode;
  sidePanelSlot?: ReactNode;
  feedSlot?: ReactNode;
  preFooterSlot?: ReactNode;
  searchSlot?: ReactNode;
  compareTraySlot?: ReactNode;
  layerControlsSlot?: ReactNode;
  navSlot?: ReactNode;
  showMap?: boolean;
  onTogglePanelSelector?: () => void;
};

export function AppShell({
  mapSlot,
  sidePanelSlot,
  feedSlot,
  preFooterSlot,
  searchSlot,
  compareTraySlot,
  layerControlsSlot,
  navSlot,
  showMap = true,
  onTogglePanelSelector,
}: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-415 flex-col gap-4 p-3 md:p-4">
      <Header searchSlot={searchSlot} compareTraySlot={compareTraySlot} navSlot={navSlot} onTogglePanelSelector={onTogglePanelSelector} />

      {showMap ? (
        <section className="flex-1">
          <MacWindow title="Global Map" bodyClassName="relative h-[560px] min-h-[560px] p-2 md:p-3">
            {layerControlsSlot ? <div className="absolute left-4 top-4 z-10">{layerControlsSlot}</div> : null}
            {mapSlot ?? (
              <div className="flex h-full min-h-90 items-center justify-center text-sm text-terminal-text-dim">
                Map area (Phase 1 scaffold)
              </div>
            )}
          </MacWindow>
        </section>
      ) : null}

      <section className="min-h-52.5">
        {feedSlot ??
          sidePanelSlot ?? (
            <div className="text-sm text-terminal-text-dim">Feeds section (Phase 1 scaffold)</div>
          )}
      </section>

      {preFooterSlot ? <section>{preFooterSlot}</section> : null}

      <SiteFooter />
    </main>
  );
}
