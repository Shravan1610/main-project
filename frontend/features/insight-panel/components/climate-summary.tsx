import type { ClimateSummaryData } from "../types";

type ClimateSummaryProps = {
  climate: ClimateSummaryData;
};

export function ClimateSummary({ climate }: ClimateSummaryProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-3">
      <p className="mb-1 text-sm text-terminal-text">Climate</p>
      <p className="text-xs text-terminal-text-dim">{climate.summary || "No climate summary"}</p>
      {climate.vulnerability ? <p className="mt-1 text-xs text-terminal-text-dim">Vulnerability: {climate.vulnerability}</p> : null}
    </div>
  );
}
