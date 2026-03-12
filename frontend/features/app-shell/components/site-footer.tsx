"use client";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-terminal-border/40 bg-terminal-bg/80">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top row: brand + links */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-terminal-green">
              GreenTrust
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-terminal-text-muted">
              Real-time sustainable finance intelligence.
              ESG scoring, climate risk, and market context — on one map.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-12">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-dim">
                Platform
              </p>
              <ul className="mt-2 space-y-1.5">
                {["Monitor", "Evidence Collection", "Document Analyzer", "Data Trail"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-[10px] text-terminal-text-muted transition-colors hover:text-terminal-text cursor-default">
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-dim">
                Intelligence
              </p>
              <ul className="mt-2 space-y-1.5">
                {["ESG Scoring", "Climate Risk", "Market Analysis", "Regulatory Compliance"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-[10px] text-terminal-text-muted transition-colors hover:text-terminal-text cursor-default">
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-dim">
                Data
              </p>
              <ul className="mt-2 space-y-1.5">
                {["Live News", "Market Feeds", "Crypto", "Webcams"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-[10px] text-terminal-text-muted transition-colors hover:text-terminal-text cursor-default">
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 h-px bg-terminal-border/30" />

        {/* Bottom row */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[9px] tabular-nums text-terminal-text-muted/60">
            © {year} GreenTrust · Sustainable Finance Intelligence Platform
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[9px] text-terminal-text-muted/60">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terminal-green" />
              All systems operational
            </span>
            <span className="text-[9px] tabular-nums text-terminal-text-muted/40">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
