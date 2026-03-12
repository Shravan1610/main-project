"use client";

import { useState } from "react";

import { ComplianceRiskPanel } from "./compliance-risk-panel";
import { DisclosureGapPanel } from "./disclosure-gap-panel";

type Tab = "disclosure-gaps" | "compliance-risk";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "disclosure-gaps", label: "Disclosure Gap Analyzer" },
  { id: "compliance-risk", label: "Compliance Risk Engine" },
];

type Props = {
  initialTab?: Tab;
};

export function RegulatoryComplianceWorkspace({ initialTab = "disclosure-gaps" }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-terminal-border pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${
              activeTab === tab.id
                ? "border-terminal-cyan/35 bg-terminal-cyan/10 text-terminal-cyan"
                : "border-transparent bg-terminal-bg/40 text-terminal-text-dim hover:border-terminal-border/80 hover:text-terminal-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      {activeTab === "disclosure-gaps" ? <DisclosureGapPanel /> : <ComplianceRiskPanel />}
    </div>
  );
}
