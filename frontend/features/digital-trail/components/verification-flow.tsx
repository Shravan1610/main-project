"use client"

interface PipelineStep {
  label: string
  detail: string
  status: "pending" | "active" | "done" | "error"
}

interface Props {
  steps: PipelineStep[]
  tampered?: boolean
}

export function VerificationFlow({ steps, tampered }: Props) {
  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">
        Verification Pipeline
      </p>

      <div className="space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const color = stepColor(step.status, tampered && isLast)

          return (
            <div key={step.label} className="flex gap-3">
              {/* Vertical connector */}
              <div className="flex flex-col items-center">
                <div className={`h-3.5 w-3.5 rounded-full border-2 ${color.dot}`} />
                {!isLast && <div className={`w-px flex-1 min-h-6 ${color.line}`} />}
              </div>

              {/* Step content */}
              <div className="pb-4">
                <p className={`text-xs font-semibold ${color.text}`}>
                  {step.label}
                  {step.status === "active" && (
                    <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-terminal-cyan" />
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-terminal-text-dim">{step.detail}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fork indicator */}
      {tampered !== undefined && (
        <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
          tampered
            ? "border-terminal-red/35 bg-terminal-red/8 text-terminal-red"
            : "border-terminal-green/35 bg-terminal-green/8 text-terminal-green"
        }`}>
          {tampered
            ? "TAMPERED — Forensic trail created. IP + timestamp captured."
            : "VERIFIED — Document matches blockchain record. No tampering detected."}
        </div>
      )}
    </div>
  )
}

function stepColor(status: PipelineStep["status"], isTamperStep?: boolean) {
  if (isTamperStep) {
    return {
      dot: "border-terminal-red bg-terminal-red/20",
      line: "bg-terminal-red/30",
      text: "text-terminal-red",
    }
  }

  switch (status) {
    case "done":
      return {
        dot: "border-terminal-green bg-terminal-green/20",
        line: "bg-terminal-green/30",
        text: "text-terminal-green",
      }
    case "active":
      return {
        dot: "border-terminal-cyan bg-terminal-cyan/20",
        line: "bg-terminal-cyan/30",
        text: "text-terminal-cyan",
      }
    case "error":
      return {
        dot: "border-terminal-red bg-terminal-red/20",
        line: "bg-terminal-red/30",
        text: "text-terminal-red",
      }
    default:
      return {
        dot: "border-terminal-border bg-terminal-bg",
        line: "bg-terminal-border",
        text: "text-terminal-text-dim",
      }
  }
}
