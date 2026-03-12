import { IntegrityRecord } from "../types/integrity.types"

export function buildLedgerRecord(
  assetName: string,
  assetType: any,
  hash: string,
  previousHash?: string,
  previousVersion?: number
): IntegrityRecord {

  // Properly increment version from previous — supports chains beyond v2
  const version = previousVersion !== undefined ? previousVersion + 1 : 1

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