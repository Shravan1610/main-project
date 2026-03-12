import type { ReactNode } from "react";

type MacWindowProps = {
  children: ReactNode;
  title: string;
  rightSlot?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function MacWindow({
  children,
  title,
  rightSlot,
  className,
  bodyClassName,
}: MacWindowProps) {
  return (
    <section
      className={joinClasses(
        "overflow-hidden rounded-[1.6rem] border border-terminal-border bg-terminal-surface text-terminal-text",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-terminal-border bg-terminal-bg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>

        <p className="flex-1 truncate text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-terminal-text-muted">
          {title}
        </p>

        <div className="flex min-w-16 justify-end text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">
          {rightSlot}
        </div>
      </div>

      <div className={joinClasses("bg-terminal-surface", bodyClassName)}>{children}</div>
    </section>
  );
}
