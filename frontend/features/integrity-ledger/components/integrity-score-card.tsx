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
    <div className="p-5 bg-slate-900 rounded-xl border border-slate-700">

      <h3 className="text-lg font-semibold mb-3">
        Integrity Status
      </h3>

      <div className="text-sm text-gray-400 mb-2">
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
          <span className="px-2 py-1 text-xs bg-green-600 rounded">
            Verified on Blockchain
          </span>
        ) : (
          <span className="px-2 py-1 text-xs bg-yellow-600 rounded">
            Pending Verification
          </span>
        )}

      </div>

    </div>
  )
}