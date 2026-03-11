import { IntegrityRecord } from "../types/integrity.types"

export function createLedgerRecord(): IntegrityRecord {

  return {
    id: crypto.randomUUID(),
    assetName: "",
    assetType: "document",
    hash: "",
    timestamp: Date.now(),
    version: 1
  }
}