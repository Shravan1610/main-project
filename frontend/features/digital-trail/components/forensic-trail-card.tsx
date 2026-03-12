"use client"

import { useState } from "react"

interface ForensicEventDisplay {
  ip: string
  timestamp: string
  attempted_hash: string
  original_hash: string
}

interface Props {
  events: ForensicEventDisplay[]
  encryptedBlob?: string
  totalAttempts: number
}

export function ForensicTrailCard({ events, encryptedBlob, totalAttempts }: Props) {
  const [decrypted, setDecrypted] = useState(false)

  if (events.length === 0 && !encryptedBlob) return null

  return (
    <div className="rounded-xl border border-terminal-red/35 bg-terminal-red/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-terminal-red animate-pulse" />
          <h4 className="text-sm font-semibold text-terminal-red">
            Forensic Trail — Tampering Detected
          </h4>
        </div>
        <span className="text-[10px] rounded border border-terminal-red/35 bg-terminal-red/10 px-2 py-0.5 text-terminal-red">
          {totalAttempts} attempt{totalAttempts !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-[11px] text-terminal-text-dim">
        The following metadata was captured because the document&apos;s SHA-256 fingerprint
        did not match the blockchain record. This data is encrypted and only accessible by the system.
      </p>

      {/* Encrypted blob preview */}
      {encryptedBlob && !decrypted && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">
            Encrypted Forensic Data
          </p>
          <div className="rounded border border-terminal-border bg-terminal-bg p-2 font-mono text-[10px] text-terminal-text-dim break-all max-h-16 overflow-hidden">
            {encryptedBlob}
          </div>
          <button
            type="button"
            onClick={() => setDecrypted(true)}
            className="rounded border border-terminal-amber/35 bg-terminal-amber/8 px-3 py-1.5 text-xs text-terminal-amber hover:bg-terminal-amber/15 transition-colors"
          >
            Decrypt Forensic Data
          </button>
        </div>
      )}

      {/* Decrypted events */}
      {(decrypted || !encryptedBlob) && events.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">
            Decrypted Forensic Events
          </p>

          <div className="space-y-2">
            {events.map((event, i) => (
              <div
                key={`${event.timestamp}-${i}`}
                className="rounded border border-terminal-border bg-terminal-bg p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-terminal-red">
                    Tamper Event #{i + 1}
                  </span>
                  <span className="text-[10px] text-terminal-text-dim">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] uppercase text-terminal-text-muted">IP Address</p>
                    <p className="font-mono text-[11px] text-terminal-amber">{event.ip}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-terminal-text-muted">Timestamp</p>
                    <p className="font-mono text-[11px] text-terminal-text">
                      {new Date(event.timestamp).toISOString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase text-terminal-text-muted">Attempted Hash</p>
                  <p className="font-mono text-[10px] text-terminal-red break-all">
                    {event.attempted_hash}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase text-terminal-text-muted">Original Hash</p>
                  <p className="font-mono text-[10px] text-terminal-green break-all">
                    {event.original_hash}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
