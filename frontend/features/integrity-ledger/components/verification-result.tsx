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

        <h3 className="text-sm font-semibold text-terminal-cyan">
          Integrity Verification Result
        </h3>

        <span
          className={`text-xs px-2 py-1 rounded border ${
            verified
              ? "border-terminal-green/35 text-terminal-green bg-terminal-green/8"
              : "border-terminal-red/35 text-terminal-red bg-terminal-red/8"
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

          <div className="font-mono text-xs break-all bg-terminal-bg border border-terminal-border p-2 rounded text-terminal-green">

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
