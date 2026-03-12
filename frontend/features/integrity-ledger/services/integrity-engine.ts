import { normalizeContent } from "./content-normalizer"
import { sha256 } from "./hash-engine"
import { buildLedgerRecord } from "./ledger-engine"
import { findLedgerRecord, storeLedgerRecord } from "./ledger-lookup"
import { createIntegrityEvent } from "./integrity-event-engine"
import { pushTrailEvent } from "./trail-integration"
import { recordHashOnBlockchain } from "./blockchain-service"
import { extractPdfChunk, encryptChunk } from "./pdf-chunk-engine"
import { registerDocument, verifyDocument as verifyDocumentApi } from "./digital-trail-api"
import type { AssetType } from "../types/integrity.types"

export async function processIntegrity(
  assetName: string,
  assetType: AssetType,
  content: unknown,
  previousHash?: string,
  previousVersion?: number
) {

  // Step 1 — Normalize content
  const normalized = normalizeContent(content)

  // Step 2 — Generate SHA256 hash
  const hash = await sha256(normalized)

  // Step 3 — Resolve previous version for proper chain tracking
  // Prefer caller-supplied previousVersion; fall back to ledger lookup only when not provided
  const resolvedVersion =
    previousVersion !== undefined
      ? previousVersion
      : previousHash
        ? findLedgerRecord(previousHash)?.version
        : undefined

  // Step 4 — Build ledger record
  const ledgerRecord = buildLedgerRecord(
    assetName,
    assetType,
    hash,
    previousHash,
    resolvedVersion
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


/**
 * Process a File through the full integrity pipeline:
 * file → SHA-256 → encrypt PDF chunk → ledger record → blockchain → backend registration
 */
export async function processFileIntegrity(
  file: File,
  assetName: string,
  assetType: AssetType = "document",
) {
  // Step 1 — Read file content and compute SHA-256
  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const hashHex = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", uint8))
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Step 2 — Extract and encrypt a small chunk of the file
  let encryptedChunk: string | undefined
  try {
    const chunk = await extractPdfChunk(file)
    encryptedChunk = await encryptChunk(chunk, hashHex)
  } catch {
    console.warn("Chunk encryption skipped")
  }

  // Step 3 — Build ledger record
  const ledgerRecord = buildLedgerRecord(assetName, assetType, hashHex)
  storeLedgerRecord(ledgerRecord)

  if (encryptedChunk) {
    ledgerRecord.encryptedChunk = encryptedChunk
  }
  ledgerRecord.verificationStatus = "unverified"

  // Step 4 — Emit creation event
  const event = createIntegrityEvent("DOCUMENT_HASH_CREATED", assetName, assetType, hashHex)
  pushTrailEvent(event)

  // Step 5 — Blockchain anchoring
  try {
    const txHash = await recordHashOnBlockchain(hashHex)
    ledgerRecord.blockchainTx = txHash

    const blockchainEvent = createIntegrityEvent("BLOCKCHAIN_PROOF_RECORDED", assetName, assetType, hashHex)
    pushTrailEvent(blockchainEvent)
  } catch {
    console.warn("Blockchain anchoring failed")
  }

  // Step 6 — Register on backend (persistent registry + real IP capture)
  try {
    const backendResult = await registerDocument(hashHex, assetName, assetType, encryptedChunk)
    if (backendResult.record.blockchain_tx) {
      ledgerRecord.blockchainTx = backendResult.record.blockchain_tx
    }
    if (backendResult.record.blockchain_network) {
      ledgerRecord.blockchainNetwork = backendResult.record.blockchain_network
    }
    if (backendResult.record.blockchain_explorer) {
      ledgerRecord.blockchainExplorer = backendResult.record.blockchain_explorer
    }
  } catch {
    console.warn("Backend registration failed — running in local-only mode")
  }

  return ledgerRecord
}


/**
 * Verify a File against the blockchain registry.
 * If the hash matches → verified. If not → backend captures IP + forensic metadata.
 */
export async function verifyFileIntegrity(
  file: File,
  originalHash?: string,
) {
  // Compute SHA-256 of the uploaded file
  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const hashHex = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", uint8))
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Check against local ledger first
  const localRecord = findLedgerRecord(hashHex)

  // Call backend for authoritative verification + forensic capture
  try {
    const result = await verifyDocumentApi(hashHex, originalHash)
    return {
      hash: hashHex,
      originalHash,
      status: result.status,
      record: result.record,
      forensicEvent: result.forensic_event,
      message: result.message,
      localMatch: Boolean(localRecord),
    }
  } catch {
    // Fallback to local-only verification
    return {
      hash: hashHex,
      originalHash,
      status: localRecord ? ("verified" as const) : ("tampered" as const),
      record: null,
      forensicEvent: null,
      message: localRecord
        ? "Local ledger match (backend unavailable)."
        : "No matching record found locally or on server.",
      localMatch: Boolean(localRecord),
    }
  }
}