/**
 * Digital Trail API client — calls the backend digital-trail endpoints.
 */

import { apiClient } from "@/shared/api/client"

export interface RegistryRecord {
  hash: string
  asset_name: string
  asset_type: string
  encrypted_chunk: string | null
  blockchain_tx: string
  blockchain_network?: "sepolia" | "simulated"
  blockchain_explorer?: string | null
  registered_at: string
  last_verified_at: string | null
  version: number
  status: "anchored" | "pending"
}

export interface ForensicEvent {
  ip: string
  timestamp: string
  attempted_hash: string
  original_hash: string
}

interface RegisterResponse {
  record: RegistryRecord
  message: string
}

interface VerifyResponse {
  status: "verified" | "tampered" | "not_found"
  hash: string
  record: RegistryRecord | null
  forensic_event: ForensicEvent | null
  message: string
}

interface ForensicTrailResponse {
  original_hash: string
  asset_name: string
  events: ForensicEvent[]
  total_tamper_attempts: number
}

interface RecordsListResponse {
  records: RegistryRecord[]
  total: number
}

/**
 * Register a document hash on the blockchain.
 */
export function registerDocument(
  hash: string,
  assetName: string,
  assetType = "document",
  encryptedChunk?: string,
) {
  return apiClient.post<RegisterResponse>("/digital-trail/register", {
    hash,
    asset_name: assetName,
    asset_type: assetType,
    encrypted_chunk: encryptedChunk ?? null,
  })
}

/**
 * Verify a document hash against the blockchain registry.
 * Optionally provide the original hash for explicit comparison.
 */
export function verifyDocument(hash: string, originalHash?: string) {
  return apiClient.post<VerifyResponse>("/digital-trail/verify", {
    hash,
    original_hash: originalHash ?? null,
  })
}

/**
 * Get a public blockchain record by hash.
 */
export function getPublicRecord(hash: string) {
  return apiClient.get<{ record: RegistryRecord }>(`/digital-trail/records/${hash}`)
}

/**
 * Get the forensic trail for a document (decrypted IP + timestamp chain).
 */
export function getForensicTrail(hash: string) {
  return apiClient.get<ForensicTrailResponse>(`/digital-trail/forensic/${hash}`)
}

/**
 * List all registered documents.
 */
export function listRecords() {
  return apiClient.get<RecordsListResponse>("/digital-trail/records")
}
