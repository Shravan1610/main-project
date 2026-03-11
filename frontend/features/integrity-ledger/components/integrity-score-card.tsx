"use client"

interface Props {
  hash: string
  version: number
  blockchainTx?: string
}

export default function IntegrityScoreCard({
  hash,
  version,
  blockchainTx
}: Props) {

  const verified = Boolean(blockchainTx)

  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-surface p-5 text-terminal-text">

      <h3 className="text-lg font-semibold mb-3">
        Integrity Status
      </h3>

      <div className="mb-2 text-sm text-terminal-text-dim">
        Document Hash
      </div>

      <div className="font-mono text-xs break-all">
        {hash}
      </div>

      <div className="mt-4 flex items-center gap-4">

        <span className="text-sm">
          Version: {version}
        </span>

        {verified ? (
          <span className="rounded border border-terminal-green/35 bg-terminal-green/8 px-2 py-1 text-xs text-terminal-green">
            Verified on Blockchain
          </span>
        ) : (
          <span className="rounded border border-terminal-amber/35 bg-terminal-amber/8 px-2 py-1 text-xs text-terminal-amber">
            Pending Verification
          </span>
        )}

      </div>

    </div>
  )
}
