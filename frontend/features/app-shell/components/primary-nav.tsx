"use client";

import Link from "next/link";

export type DashboardTab =
  | "monitor"
  | "document-analyzer"
  | "data-trail"
  | "evidence-collection"
  | "disclosure-gap-analyzer"
  | "compliance-risk-engine";

type DashboardNavItem = {
  id: DashboardTab | `legal-${string}`;
  label: string;
  href?: string;
  activeTabs?: DashboardTab[];
  disabled?: boolean;
};

type DashboardNavSection = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

const NAV_SECTIONS: DashboardNavSection[] = [
  {
    id: "finances",
    label: "Finances",
    items: [{ id: "monitor", href: "/", label: "Monitor" }],
  },
  {
    id: "esgs",
    label: "ESGs",
    items: [
      { id: "document-analyzer", href: "/document-analyzer", label: "Document Analyses" },
      { id: "data-trail", href: "/data-trail", label: "Data Trail", activeTabs: ["data-trail"] },
      { id: "evidence-collection", href: "/evidence-collection", label: "Evidence Collection" },
    ],
  },
  {
    id: "legal-compliance",
    label: "Legal Compliance",
    items: [
      { id: "disclosure-gap-analyzer", href: "/disclosure-gap-analyzer", label: "Disclosure Gap Analyzer" },
      { id: "compliance-risk-engine", href: "/compliance-risk-engine", label: "Compliance Risk Engine" },
    ],
  },
];

type PrimaryNavProps = {
  activeTab: DashboardTab;
};

export function PrimaryNav({ activeTab }: PrimaryNavProps) {
  return (
    <nav aria-label="Primary sections" className="-mx-1 overflow-x-auto px-1">
      <div className="flex min-w-max items-start gap-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="min-w-fit rounded-2xl border border-terminal-border/55 bg-terminal-bg/25 px-2.5 py-2">
            <p className="px-1 pb-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-terminal-text-muted">
              {section.label}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {section.items.map((item) => {
                const isActive = !item.disabled && (item.activeTabs ?? [item.id as DashboardTab]).includes(activeTab);
                const className = `inline-flex items-center whitespace-nowrap rounded-xl border px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors duration-200 ${
                  item.disabled
                    ? "cursor-default border-terminal-border/45 bg-terminal-bg/20 text-terminal-text-muted/70"
                    : isActive
                      ? "border-terminal-cyan/35 bg-terminal-cyan/10 text-terminal-cyan shadow-[0_0_0_1px_rgb(var(--terminal-cyan)/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan/45 focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-surface"
                      : "border-transparent bg-terminal-bg/40 text-terminal-text-dim hover:border-terminal-border/80 hover:bg-terminal-bg/80 hover:text-terminal-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan/45 focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-surface"
                }`;

                if (item.disabled || !item.href) {
                  return (
                    <span
                      key={item.id}
                      aria-disabled="true"
                      className={className}
                    >
                      {item.label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={className}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
