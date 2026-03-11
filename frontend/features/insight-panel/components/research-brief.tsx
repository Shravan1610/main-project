import type { CoverageSummary, ResearchBrief } from "../types";

type ResearchBriefProps = {
  brief?: ResearchBrief;
  coverage?: CoverageSummary;
};

export function ResearchBriefCard({ brief, coverage }: ResearchBriefProps) {
  if (!brief) {
    return null;
  }

  return (
    <section className="rounded border border-terminal-border bg-terminal-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm text-terminal-text">AI Research Brief</h4>
        <span className="text-[11px] text-terminal-text-dim">Confidence {(brief.confidence * 100).toFixed(0)}%</span>
      </div>

      <p className="text-xs leading-relaxed text-terminal-text-dim">{brief.summary}</p>

      {brief.keyPoints.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-terminal-text-dim">
          {brief.keyPoints.slice(0, 3).map((point, index) => (
            <li key={`${point}-${index}`}>• {point}</li>
          ))}
        </ul>
      ) : null}

      {coverage ? (
        <div className="mt-2 border-t border-terminal-border pt-2 text-[11px] text-terminal-text-dim">
          Coverage: {coverage.articleCount} articles, {coverage.sourceCount} sources
        </div>
      ) : null}
    </section>
  );
}
