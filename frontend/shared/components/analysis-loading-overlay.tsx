"use client";

import { useEffect, useState } from "react";

const ANALYSIS_PHASES = [
  "Extracting content…",
  "Running NLP entity extraction…",
  "Scoring ESG risk metrics…",
  "Evaluating greenwashing signals…",
  "Analyzing climate claim credibility…",
  "Cross-referencing framework compliance…",
  "Generating risk breakdown…",
  "Compiling final report…",
];

type Props = {
  label?: string;
  phases?: string[];
};

export function AnalysisLoadingOverlay({ label = "Analyzing", phases = ANALYSIS_PHASES }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [phases.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-terminal-cyan/20 bg-terminal-surface/80 p-8">
      {/* Scan line animation */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 h-px bg-linear-to-r from-transparent via-terminal-cyan/40 to-transparent animate-scan-line" />
      </div>

      <div className="relative flex flex-col items-center gap-5">
        {/* Pulsing rings */}
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-terminal-cyan/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-terminal-cyan/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full border-2 border-terminal-cyan/50 animate-pulse-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-terminal-cyan" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>

        {/* Main label */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wider text-terminal-cyan">
            {label}{dots}
          </p>
          <p className="mt-2 text-xs text-terminal-text-muted transition-all duration-500">
            {phases[phaseIndex]}
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1.5">
          {phases.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                i <= phaseIndex
                  ? "bg-terminal-cyan scale-110"
                  : "bg-terminal-border"
              }`}
            />
          ))}
        </div>

        {/* Terminal-style log lines */}
        <div className="w-full max-w-md rounded-lg border border-terminal-border/50 bg-terminal-bg/60 px-4 py-3">
          {phases.slice(0, phaseIndex + 1).slice(-3).map((phase, i, arr) => (
            <p key={phase} className={`font-mono text-[10px] leading-5 ${
              i === arr.length - 1
                ? "text-terminal-cyan"
                : "text-terminal-text-muted"
            }`}>
              <span className="text-terminal-green mr-2">{">"}</span>
              {phase}
              {i === arr.length - 1 && <span className="ml-1 inline-block w-1.5 h-3 bg-terminal-cyan animate-pulse" />}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
