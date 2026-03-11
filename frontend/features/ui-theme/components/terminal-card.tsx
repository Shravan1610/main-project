// frontend/features/ui-theme/components/terminal-card.tsx
// Terminal card — reusable card with terminal border, glow styling
//
// Owner: Srijan
// Task: SR-1-04
// Phase: 1 — Scaffolding
//
// Props: { children: ReactNode, className?: string, glow?: "green"|"cyan"|"amber"|"red" }
// Renders: dark surface card with border glow, terminal aesthetic

import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type TerminalCardProps = {
  children: ReactNode;
  className?: string;
  glow?: "green" | "cyan" | "amber" | "red";
};

const GLOW_CLASS: Record<NonNullable<TerminalCardProps["glow"]>, string> = {
  green: "shadow-glow",
  cyan: "shadow-glow-cyan",
  amber: "shadow-glow-amber",
  red: "shadow-glow-red",
};

export function TerminalCard({ children, className, glow = "green" }: TerminalCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-terminal-border bg-terminal-surface/80 p-4",
        GLOW_CLASS[glow],
        className,
      )}
    >
      {children}
    </div>
  );
}
