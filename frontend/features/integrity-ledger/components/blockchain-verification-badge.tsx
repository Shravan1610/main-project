"use client"

interface Props {
  tx?: string
}

export default function BlockchainVerificationBadge({ tx }: Props) {

  if (!tx) {
    return (
      <span className="text-sm text-terminal-amber">
        Blockchain Proof Pending
      </span>
    )
  }

  return (
    <div className="rounded border border-terminal-green/35 bg-terminal-green/8 p-3">

      <div className="text-sm text-terminal-green">
        Blockchain Verified
      </div>

      <div className="mt-1 break-all font-mono text-xs text-terminal-text">
        TX: {tx}
      </div>

    </div>
  )
}
