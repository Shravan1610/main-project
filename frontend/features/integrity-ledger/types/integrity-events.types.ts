export type IntegrityEventType =
  | "DOCUMENT_HASH_CREATED"
  | "DOCUMENT_VERSION_UPDATED"
  | "DOCUMENT_TAMPER_ALERT"
  | "BLOCKCHAIN_PROOF_RECORDED"

export interface IntegrityEvent {

  id: string

  type: IntegrityEventType

  assetName: string
  assetType: string

  hash: string

  timestamp: number

  metadata?: Record<string, any>
}