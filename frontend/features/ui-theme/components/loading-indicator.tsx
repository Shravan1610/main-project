// Loading spinner | Owner: Srijan | Task: SR-1-06
import { cn } from "@/shared/lib";

type LoadingIndicatorProps = {
  label?: string;
  className?: string;
};

export function LoadingIndicator({ label = "Loading", className }: LoadingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-terminal-text-dim", className)}>
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-terminal-green" />
      <span>{label}</span>
    </div>
  );
}
