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
  blockchainNetwork?: "sepolia" | "simulated"
  blockchainExplorer?: string | null

  version: number
  previousHash?: string

  // Digital Trail extensions
  encryptedChunk?: string
  verificationStatus?: "verified" | "tampered" | "unverified"
  lastVerifiedAt?: number
  forensicMetadata?: string
}