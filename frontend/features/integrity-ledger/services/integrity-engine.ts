import { normalizeContent } from "./content-normalizer"
import { sha256 } from "./hash-engine"
import { buildLedgerRecord } from "./ledger-engine"

import { createIntegrityEvent } from "./integrity-event-engine"
import { pushTrailEvent } from "./trail-integration"

import { recordHashOnChain } from "./blockchain-engine"

export async function processIntegrity(
  assetName: string,
  assetType: string,
  content: unknown,
  previousHash?: string
) {

  // Step 1 — Normalize content
  const normalized = normalizeContent(content)

  // Step 2 — Generate SHA256 hash
  const hash = await sha256(normalized)

  // Step 3 — Build ledger record
  const ledgerRecord = buildLedgerRecord(
    assetName,
    assetType,
    hash,
    previousHash
  )

  /* --------------------------------------------------
     Determine integrity event type
  -------------------------------------------------- */

  let eventType:
    | "DOCUMENT_HASH_CREATED"
    | "DOCUMENT_VERSION_UPDATED"
    | "DOCUMENT_TAMPER_ALERT"

  if (!previousHash) {

    eventType = "DOCUMENT_HASH_CREATED"

  } else if (previousHash === hash) {

    eventType = "DOCUMENT_VERSION_UPDATED"

  } else {

    eventType = "DOCUMENT_TAMPER_ALERT"

  }

  /* --------------------------------------------------
     Emit integrity event
  -------------------------------------------------- */

  const event = createIntegrityEvent(
    eventType,
    assetName,
    assetType,
    hash
  )

  pushTrailEvent(event)

  /* --------------------------------------------------
     Blockchain Verification
  -------------------------------------------------- */

  try {

    const txHash = await recordHashOnChain(hash)

    // attach blockchain tx to ledger record
    ledgerRecord.blockchainTx = txHash

    const blockchainEvent = createIntegrityEvent(
      "BLOCKCHAIN_PROOF_RECORDED",
      assetName,
      assetType,
      hash
    )

    pushTrailEvent(blockchainEvent)

  } catch (error) {

    console.warn("Blockchain verification failed:", error)

  }

  return ledgerRecord
}