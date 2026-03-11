import type { Driver } from "../types";

type DriverListProps = {
  drivers: Driver[];
};

export function DriverList({ drivers }: DriverListProps) {
  if (drivers.length === 0) {
    return <p className="text-xs text-terminal-text-dim">No drivers available.</p>;
  }

  return (
    <ul className="space-y-1 text-xs">
      {drivers.map((driver, index) => (
        <li key={`${driver.label}-${index}`} className="text-terminal-text-dim">
          • {driver.label}
        </li>
      ))}
    </ul>
  );
}
