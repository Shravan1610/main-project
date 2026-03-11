// Terminal-styled badge | Owner: Srijan | Task: SR-1-05
import { CATEGORY_COLORS } from "@/features/ui-theme/constants";
import { cn } from "@/shared/lib";

type BadgeVariant = keyof typeof CATEGORY_COLORS;

type TerminalBadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

export function TerminalBadge({ label, variant = "general", className }: TerminalBadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}
      style={{
        borderColor: CATEGORY_COLORS[variant],
        color: CATEGORY_COLORS[variant],
        backgroundColor: "rgba(17, 24, 39, 0.6)",
      }}
    >
      {label}
    </span>
  );
}
