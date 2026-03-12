"use client"

import { useState, useCallback } from "react"
import { processIntegrity } from "../services/integrity-engine"
import { verifyContent } from "../services/verification-engine"
import { getTrailEvents } from "../services/trail-integration"
import type { IntegrityRecord } from "../types/integrity.types"
import type { IntegrityEvent } from "../types/integrity-events.types"

export function useIntegrity() {

  const [records, setRecords] = useState<IntegrityRecord[]>([])
  const [events, setEvents] = useState<IntegrityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Submit a document through the full integrity pipeline:
   * normalization → SHA256 → ledger record → blockchain anchoring → event trail
   */
  const submitDocument = useCallback(
    async (
      assetName: string,
      assetType: string,
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

        const record = await processIntegrity(
          assetName,
          assetType,
          content,
          previousHash
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
   * Detect whether a record has been tampered with by comparing hashes.
   */
  const checkTamper = useCallback((record: IntegrityRecord): boolean => {
    return Boolean(record.previousHash && record.previousHash !== record.hash)
  }, [])

  /**
   * Pull the latest events from the global trail store into React state.
   */
  const refreshEvents = useCallback(() => {
    setEvents(getTrailEvents())
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
  }
}
