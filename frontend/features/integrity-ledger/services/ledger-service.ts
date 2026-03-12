import { buildLedgerRecord } from "./ledger-engine"
import { findLedgerRecord, storeLedgerRecord } from "./ledger-lookup"
import type { IntegrityRecord } from "../types/integrity.types"

export function createLedgerRecord(
  assetName: string,
  assetType: IntegrityRecord["assetType"],
  hash: string,
  previousHash?: string,
  previousVersion?: number
): IntegrityRecord {
  return buildLedgerRecord(assetName, assetType, hash, previousHash, previousVersion)
}

export { findLedgerRecord, storeLedgerRecord }