import { formatScore } from "@/shared/utils";

import { DriverList } from "./driver-list";
import type { Driver } from "../types";

type ScoreCardProps = {
  label: string;
  value: number;
  drivers: Driver[];
  barClassName?: string;
  textClassName?: string;
};

export function ScoreCard({
  label,
  value,
  drivers,
  barClassName = "bg-terminal-green",
  textClassName = "text-terminal-green",
}: ScoreCardProps) {
  const score = formatScore(value);

  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-terminal-text">{label}</p>
        <p className={`text-sm font-semibold ${textClassName}`}>{score}</p>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded bg-terminal-bg">
        <div className={`h-full ${barClassName}`} style={{ width: `${score}%` }} />
      </div>
      <DriverList drivers={drivers.slice(0, 3)} />
    </div>
  );
}
