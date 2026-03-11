import { formatScore } from "@/shared/utils";

import { DriverList } from "./driver-list";
import type { Driver } from "../types";

type ScoreCardProps = {
  label: string;
  value: number;
  drivers: Driver[];
};

export function ScoreCard({ label, value, drivers }: ScoreCardProps) {
  const score = formatScore(value);

  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-terminal-text">{label}</p>
        <p className="text-sm font-semibold text-terminal-green">{score}</p>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded bg-terminal-bg">
        <div className="h-full bg-terminal-green" style={{ width: `${score}%` }} />
      </div>
      <DriverList drivers={drivers} />
    </div>
  );
}
