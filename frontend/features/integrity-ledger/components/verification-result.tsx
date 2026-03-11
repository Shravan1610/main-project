"use client"

interface Props {
  result: any
}

export default function VerificationResult({ result }: Props) {

  if (!result) return null

  const verified = result.verified

  return (

    <div className="border border-terminal-border bg-terminal-surface rounded p-4 mt-4 space-y-4">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <h3 className="text-sm font-semibold text-cyan-300">
          Integrity Verification Result
        </h3>

        <span
          className={`text-xs px-2 py-1 rounded border ${
            verified
              ? "border-green-500 text-green-400 bg-green-500/10"
              : "border-red-500 text-red-400 bg-red-500/10"
          }`}
        >
          {verified ? "VERIFIED" : "NOT FOUND"}
        </span>

      </div>

      {/* HASH */}

      <div>

        <p className="text-xs text-terminal-text-dim mb-1">
          Cryptographic Fingerprint (SHA256)
        </p>

        <div className="font-mono text-xs break-all bg-terminal-bg border border-terminal-border p-2 rounded">

          {result.hash}

        </div>

      </div>

      {/* BLOCKCHAIN */}

      {result.blockchainTx && (

        <div>

          <p className="text-xs text-terminal-text-dim mb-1">
            Blockchain Proof
          </p>

          <div className="font-mono text-xs break-all bg-terminal-bg border border-terminal-border p-2 rounded text-green-400">

            TX: {result.blockchainTx}

          </div>

        </div>

      )}

      {/* MESSAGE */}

      <div className="text-xs text-terminal-text-dim">

        {verified ? (
          <p>
            This document fingerprint exists in the Integrity Ledger and has
            been recorded on-chain. The content has not been modified since
            verification.
          </p>
        ) : (
          <p>
            No matching fingerprint was found in the Integrity Ledger. This
            content may be new, altered, or not yet verified.
          </p>
        )}

      </div>

    </div>

  )
}