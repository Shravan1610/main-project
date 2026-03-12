"use client";

import { useState } from "react";

import { API_BASE_URL } from "@/shared/constants";

type Props = {
  endpoint: string;
  data: Record<string, unknown>;
  filename?: string;
  label?: string;
};

export function DownloadReportButton({
  endpoint,
  data,
  filename = "report.pdf",
  label = "Download PDF Report",
}: Props) {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Report generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail — user will see button is back to normal
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={downloading}
      className="group flex items-center gap-2 rounded-lg border border-terminal-cyan/30 bg-terminal-cyan/8 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-terminal-cyan transition-all hover:bg-terminal-cyan/15 hover:border-terminal-cyan/50 disabled:opacity-50"
    >
      {downloading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {downloading ? "Generating…" : label}
    </button>
  );
}
