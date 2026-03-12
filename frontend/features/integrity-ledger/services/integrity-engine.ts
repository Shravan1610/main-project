import { normalizeContent } from "./content-normalizer"
import { sha256 } from "./hash-engine"
import { buildLedgerRecord } from "./ledger-engine"
import { findLedgerRecord, storeLedgerRecord } from "./ledger-lookup"
import { createIntegrityEvent } from "./integrity-event-engine"
import { pushTrailEvent } from "./trail-integration"
import { recordHashOnBlockchain } from "./blockchain-service"

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

  // Step 3 — Resolve previous version for proper chain tracking
  const previousRecord = previousHash ? findLedgerRecord(previousHash) : undefined
  const previousVersion = previousRecord?.version

  // Step 4 — Build ledger record
  const ledgerRecord = buildLedgerRecord(
    assetName,
    assetType,
    hash,
    previousHash,
    previousVersion
  )

  // Step 5 — Persist to in-memory ledger (enables verification lookups)
  storeLedgerRecord(ledgerRecord)

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
     Blockchain Proof Anchoring
  -------------------------------------------------- */

  try {

    const txHash = await recordHashOnBlockchain(hash)

    // Attach blockchain tx — object is already in ledger store by reference
    ledgerRecord.blockchainTx = txHash

    const blockchainEvent = createIntegrityEvent(
      "BLOCKCHAIN_PROOF_RECORDED",
      assetName,
      assetType,
      hash
    )

    pushTrailEvent(blockchainEvent)

  } catch (error) {

    console.warn("Blockchain anchoring failed:", error)

  }

  return ledgerRecord
}