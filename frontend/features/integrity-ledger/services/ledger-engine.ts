import { IntegrityRecord } from "../types/integrity.types"

export function buildLedgerRecord(
  assetName: string,
  assetType: any,
  hash: string,
  previousHash?: string
): IntegrityRecord {

  const version = previousHash ? 2 : 1

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