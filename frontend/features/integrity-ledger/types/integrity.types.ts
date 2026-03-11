export type AssetType =
  | "crypto"
  | "webpage"
  | "document"
  | "digital"
  | "blockchain";

export interface IntegrityRecord {
  id: string
  assetName: string
  assetType: AssetType

  hash: string

  timestamp: number
  editorIp?: string

  blockchainTx?: string

  version: number
  previousHash?: string
}