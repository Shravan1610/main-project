import { IntegrityRecord } from "../types/integrity.types"

export function buildLedgerRecord(
  assetName: string,
  assetType: IntegrityRecord["assetType"],
  hash: string,
  previousHash?: string,
  previousVersion?: number
): IntegrityRecord {

  // Properly increment version from previous — supports chains beyond v2
  let version: number
  if (previousVersion !== undefined) {
    version = previousVersion + 1
  } else if (previousHash !== undefined) {
    // When chaining is requested via previousHash but previousVersion is missing,
    // assume this is at least the second version to avoid version === 1 with a previousHash.
    version = 2
  } else {
    version = 1
  }

  return {
    id: crypto.randomUUID(),

    assetName,
    assetType,

    hash,

    timestamp: Date.now(),

    version,

    previousHash
  }
}