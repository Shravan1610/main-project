"use client"

interface Props {
  hash: string
  assetName: string
  blockchainTx?: string
  blockchainNetwork?: "sepolia" | "simulated"
  blockchainExplorer?: string | null
  registeredAt?: string
  lastVerifiedAt?: string | null
  version?: number
  status?: "anchored" | "pending"
  encryptedChunk?: string
}

export function BlockchainRecordCard({
  hash,
  assetName,
  blockchainTx,
  blockchainNetwork,
  blockchainExplorer,
  registeredAt,
  lastVerifiedAt,
  version = 1,
  status = "anchored",
  encryptedChunk,
}: Props) {
  const anchored = status === "anchored" && Boolean(blockchainTx)
  const isRealChain = blockchainNetwork === "sepolia"

  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">
            Public Blockchain Record
          </p>
          <p className="mt-1 text-sm font-semibold text-terminal-text">{assetName}</p>
        </div>
        <div className="flex items-center gap-2">
          {blockchainNetwork && (
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded border font-medium ${
              isRealChain
                ? "border-terminal-cyan/35 text-terminal-cyan bg-terminal-cyan/8"
                : "border-terminal-text-muted/35 text-terminal-text-muted bg-terminal-text-muted/8"
            }`}>
              {isRealChain ? "Sepolia Testnet" : "Simulated"}
            </span>
          )}
          <span className={`shrink-0 text-[11px] px-2 py-1 rounded border font-medium ${
            anchored
              ? "border-terminal-green/35 text-terminal-green bg-terminal-green/8"
              : "border-terminal-amber/35 text-terminal-amber bg-terminal-amber/8"
          }`}>
            {anchored ? "Anchored" : "Pending"}
          </span>
        </div>
      </div>

      {/* SHA-256 */}
      <div>
        <p className="text-[9px] uppercase text-terminal-text-muted mb-1">SHA-256 Fingerprint</p>
        <p className="font-mono text-[11px] text-terminal-cyan break-all bg-terminal-bg border border-terminal-border rounded px-2 py-1.5">
          {hash}
        </p>
      </div>

      {/* Blockchain TX */}
      {blockchainTx && (
        <div>
          <p className="text-[9px] uppercase text-terminal-text-muted mb-1">Blockchain Transaction</p>
          {blockchainExplorer ? (
            <a
              href={blockchainExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="group block font-mono text-[11px] text-terminal-green break-all bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 hover:border-terminal-green/50 transition-colors"
            >
              {blockchainTx}
              <span className="ml-2 inline-block text-[9px] text-terminal-green/60 group-hover:text-terminal-green transition-colors">
                View on Etherscan ↗
              </span>
            </a>
          ) : (
            <p className="font-mono text-[11px] text-terminal-green break-all bg-terminal-bg border border-terminal-border rounded px-2 py-1.5">
              {blockchainTx}
            </p>
          )}
        </div>
      )}

      {/* Encrypted Chunk Indicator */}
      {encryptedChunk && (
        <div>
          <p className="text-[9px] uppercase text-terminal-text-muted mb-1">Encrypted PDF Fragment</p>
          <p className="font-mono text-[10px] text-terminal-text-dim break-all bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 max-h-10 overflow-hidden">
            {encryptedChunk.slice(0, 80)}…
          </p>
        </div>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-terminal-text-dim pt-2 border-t border-terminal-border">
        <span>Version {version}</span>
        {registeredAt && <span>Registered: {new Date(registeredAt).toLocaleString()}</span>}
        {lastVerifiedAt && <span>Last verified: {new Date(lastVerifiedAt).toLocaleString()}</span>}
      </div>
    </div>
  )
}
