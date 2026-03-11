"use client"

interface Props {
  tx?: string
}

export default function BlockchainVerificationBadge({ tx }: Props) {

  if (!tx) {
    return (
      <span className="text-yellow-500 text-sm">
        Blockchain Proof Pending
      </span>
    )
  }

  return (
    <div className="p-3 bg-slate-800 rounded border border-green-600">

      <div className="text-sm text-green-400">
        Blockchain Verified
      </div>

      <div className="text-xs font-mono break-all mt-1">
        TX: {tx}
      </div>

    </div>
  )
}