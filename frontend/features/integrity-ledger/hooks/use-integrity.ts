"use client"

import { useState, useCallback } from "react"
import { processIntegrity, processFileIntegrity, verifyFileIntegrity } from "../services/integrity-engine"
import { verifyContent } from "../services/verification-engine"
import { getTrailEvents } from "../services/trail-integration"
import { getForensicTrail } from "../services/digital-trail-api"
import type { AssetType, IntegrityRecord } from "../types/integrity.types"
import type { IntegrityEvent } from "../types/integrity-events.types"

export interface ForensicEventUI {
  ip: string
  timestamp: string
  attempted_hash: string
  original_hash: string
}

export interface VerificationResultUI {
  hash: string
  originalHash?: string
  status: "verified" | "tampered" | "not_found"
  message: string
  forensicEvent: ForensicEventUI | null
  localMatch: boolean
}

export function useIntegrity() {

  const [records, setRecords] = useState<IntegrityRecord[]>([])
  const [events, setEvents] = useState<IntegrityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResultUI | null>(null)
  const [forensicTrail, setForensicTrail] = useState<ForensicEventUI[]>([])

  /**
   * Submit a document through the full integrity pipeline:
   * normalization → SHA256 → ledger record → blockchain anchoring → event trail
   */
  const submitDocument = useCallback(
    async (
      assetName: string,
      assetType: AssetType,
      content: unknown
    ): Promise<IntegrityRecord> => {

      setLoading(true)
      setError(null)

      try {

        // Find the most recent record for this asset to chain versions
        const existing = records
          .filter(r => r.assetName === assetName)
          .sort((a, b) => b.version - a.version)[0]

        const previousHash = existing?.hash
        const previousVersion = existing?.version

        const record = await processIntegrity(
          assetName,
          assetType,
          content,
          previousHash,
          previousVersion
        )

        setRecords(prev => [...prev, record])

        // Sync event trail from global store
        setEvents(getTrailEvents())

        return record

      } catch (err) {

        const msg = err instanceof Error ? err.message : "Failed to process document"
        setError(msg)
        throw err

      } finally {

        setLoading(false)

      }

    },
    [records]
  )

  /**
   * Verify a document against the integrity ledger.
   * Returns { verified, hash, blockchainTx, version }
   */
  const verifyDocument = useCallback(async (content: unknown) => {

    setLoading(true)
    setError(null)

    try {

      return await verifyContent(content)

    } catch (err) {

      const msg = err instanceof Error ? err.message : "Verification failed"
      setError(msg)
      throw err

    } finally {

      setLoading(false)

    }

  }, [])

  /**
   * Detect whether a record has been tampered with by validating the hash chain
   * against the previous record in local state.
   */
  const checkTamper = useCallback((record: IntegrityRecord): boolean => {

    // If there is no previous hash, we cannot infer tampering from the chain.
    if (!record.previousHash) {
      return false
    }

    // Find the previous version of this asset (if present in local records).
    const previousRecord = records
      .filter(r => r.assetName === record.assetName && r.version === record.version - 1)
      .sort((a, b) => b.version - a.version)[0]

    // If we don't have the previous record locally, we cannot validate the chain here.
    if (!previousRecord) {
      return false
    }

    // Tampering is flagged if the stored previousHash does not match the actual
    // hash of the previous record in the chain.
    return previousRecord.hash !== record.previousHash

  }, [records])

  /**
   * Pull the latest events from the global trail store into React state.
   */
  const refreshEvents = useCallback(() => {
    setEvents(getTrailEvents())
  }, [])

  /**
   * Submit a File through the full integrity pipeline:
   * file → SHA-256 → encrypt chunk → ledger → blockchain → backend register
   */
  const submitFile = useCallback(
    async (file: File, assetName: string, assetType: AssetType = "document"): Promise<IntegrityRecord> => {
      setLoading(true)
      setError(null)
      setVerificationResult(null)

      try {
        const record = await processFileIntegrity(file, assetName, assetType)
        setRecords((prev) => [...prev, record])
        setEvents(getTrailEvents())
        return record
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to process file"
        setError(msg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  /**
   * Verify a File against the blockchain registry.
   * If hash differs → backend captures IP + creates forensic trail.
   */
  const verifyFile = useCallback(
    async (file: File, originalHash?: string): Promise<VerificationResultUI> => {
      setLoading(true)
      setError(null)

      try {
        const result = await verifyFileIntegrity(file, originalHash)
        const vResult: VerificationResultUI = {
          hash: result.hash,
          originalHash: result.originalHash,
          status: result.status,
          message: result.message,
          forensicEvent: result.forensicEvent,
          localMatch: result.localMatch,
        }
        setVerificationResult(vResult)

        // If tampered, refresh forensic trail
        if (result.status === "tampered" && originalHash) {
          await refreshForensicTrail(originalHash)
        }

        setEvents(getTrailEvents())
        return vResult
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Verification failed"
        setError(msg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /**
   * Fetch the forensic trail for a document hash from the backend.
   */
  const refreshForensicTrail = useCallback(async (hash: string) => {
    try {
      const trail = await getForensicTrail(hash)
      setForensicTrail(trail.events ?? [])
    } catch {
      // Forensic trail unavailable — not critical
    }
  }, [])

  return {
    records,
    events,
    loading,
    error,
    submitDocument,
    verifyDocument,
    checkTamper,
    refreshEvents,
    // New digital trail methods
    submitFile,
    verifyFile,
    verificationResult,
    forensicTrail,
    refreshForensicTrail,
  }
}
