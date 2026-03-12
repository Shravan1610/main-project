"use client"

interface Props {
  verified: boolean
  hash?: string
}

export default function VerificationBadge({ verified, hash }: Props) {

  return (

    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold ${
        verified
          ? "border-terminal-green/35 bg-terminal-green/8 text-terminal-green"
          : "border-terminal-red/35 bg-terminal-red/8 text-terminal-red"
      }`}
    >

      <span
        className={`w-2 h-2 rounded-full ${
          verified ? "bg-terminal-green" : "bg-terminal-red"
        }`}
      />

      {verified ? "VERIFIED" : "NOT VERIFIED"}

      {hash && (
        <span className="font-mono text-[10px] opacity-70 ml-1">
          {hash.slice(0, 8)}&hellip;
        </span>
      )}

    </div>

  )
}