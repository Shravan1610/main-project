"use client"

import type { IntegrityRecord } from "../types/integrity.types"

interface Props {
  records: IntegrityRecord[]
}

export default function VersionTimeline({ records }: Props) {

  const sorted = [...records].sort((a, b) => a.version - b.version)

  return (

    <div className="rounded border border-terminal-border bg-terminal-surface p-4">

      <h3 className="text-sm font-semibold text-terminal-text mb-4">
        Version History
      </h3>

      {sorted.length === 0 ? (
        <p className="text-xs text-terminal-text-dim">
          No version history available.
        </p>
      ) : (

        <div className="relative">

          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-terminal-border" />

          <div className="space-y-5">

            {sorted.map((record, index) => {

              const isLatest = index === sorted.length - 1

              return (

                <div key={record.id} className="relative pl-7">

                  {/* Dot */}
                  <div
                    className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      isLatest
                        ? "border-terminal-cyan bg-terminal-cyan/20"
                        : "border-terminal-border bg-terminal-bg"
                    }`}
                  />

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isLatest ? "text-terminal-cyan" : "text-terminal-text"
                      }`}
                    >
                      Version {record.version}
                      {isLatest && (
                        <span className="ml-2 text-[10px] text-terminal-text-dim font-normal">
                          (current)
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-terminal-text-dim">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="font-mono text-[10px] text-terminal-text-dim mt-1 break-all">
                    {record.hash}
                  </p>

                  {record.blockchainTx && (
                    <p className="text-[10px] text-terminal-green mt-1 font-mono break-all">
                      TX: {record.blockchainTx}
                    </p>
                  )}

                  {record.previousHash && (
                    <p className="text-[10px] text-terminal-amber mt-1">
                      Modified from previous version
                    </p>
                  )}

                </div>

              )

            })}

          </div>

        </div>

      )}

    </div>

  )
}