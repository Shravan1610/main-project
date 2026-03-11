import { IntegrityEvent } from "../types/integrity-events.types"

export function createIntegrityEvent(

  type: IntegrityEvent["type"],
  assetName: string,
  assetType: string,
  hash: string

): IntegrityEvent {

  return {

    id: crypto.randomUUID(),

    type,

    assetName,
    assetType,

    hash,

    timestamp: Date.now()

  }
}