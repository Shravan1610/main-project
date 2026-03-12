"use client"

import type { IntegrityRecord } from "../types/integrity.types"

interface Props {
  record: IntegrityRecord
}

export default function IntegrityCard({ record }: Props) {

  const anchored = Boolean(record.blockchainTx)

  return (

    <div className="rounded-xl border border-terminal-border bg-terminal-surface p-4 space-y-3">

      {/* Title row */}
      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-sm font-semibold text-terminal-text">
            {record.assetName}
          </p>
          <p className="text-xs text-terminal-text-dim capitalize mt-0.5">
            {record.assetType}
          </p>
        </div>

        <span
          className={`shrink-0 text-[11px] px-2 py-1 rounded border font-medium ${
            anchored
              ? "border-terminal-green/35 text-terminal-green bg-terminal-green/8"
              : "border-terminal-amber/35 text-terminal-amber bg-terminal-amber/8"
          }`}
        >
          {anchored ? "Anchored" : "Pending"}
        </span>

      </div>

      {/* Hash */}
      <div>
        <p className="text-xs text-terminal-text-dim mb-1">SHA256 Fingerprint</p>
        <p className="font-mono text-[11px] break-all text-terminal-cyan">
          {record.hash}
        </p>
      </div>

      {/* Blockchain TX */}
      {record.blockchainTx && (
        <div>
          <p className="text-xs text-terminal-text-dim mb-1">Blockchain Proof</p>
          <p className="font-mono text-[11px] break-all text-terminal-green">
            {record.blockchainTx}
          </p>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-4 text-[11px] text-terminal-text-dim pt-1 border-t border-terminal-border">
        <span>Version {record.version}</span>
        <span>{new Date(record.timestamp).toLocaleString()}</span>
        {record.previousHash && record.previousHash !== record.hash && (
          <span className="text-terminal-amber">Updated</span>
        )}
      </div>

    </div>

  )
}