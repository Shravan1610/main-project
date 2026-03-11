import { normalizeContent } from "./content-normalizer"
import { sha256 } from "./hash-engine"
import { findLedgerRecord } from "./ledger-lookup"

export async function verifyContent(content: unknown) {

  const normalized = normalizeContent(content)

  const hash = await sha256(normalized)

  const record = findLedgerRecord(hash)

  return {

    hash,

    verified: Boolean(record),

    blockchainTx: record?.blockchainTx,

    version: record?.version

  }

}