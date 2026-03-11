"use client";

import { useCallback, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { cn } from "@/shared/lib/cn";

interface AnimatedThemeTogglerProps extends ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

type ViewTransitionLike = {
  ready: Promise<unknown>;
};

type StartViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

export function AnimatedThemeToggler({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDark = resolvedTheme === "dark";

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y),
    );

    const nextTheme = isDark ? "light" : "dark";
    const applyTheme = () => {
      setTheme(nextTheme);
    };

    const transitionDocument = document as StartViewTransitionDocument;
    if (typeof transitionDocument.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    const transition = transitionDocument.startViewTransition(() => {
      flushSync(applyTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }, [duration, isDark, setTheme]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-terminal-border bg-terminal-bg/70 text-terminal-text transition-colors hover:bg-terminal-border/30",
        className,
      )}
      {...props}
    >
      {resolvedTheme ? (isDark ? <Sun size={16} /> : <Moon size={16} />) : <Moon size={16} />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
