import { processIntegrity } from "../services/integrity-engine"

export function useIntegrityLedger() {

  async function createIntegrityRecord(

    assetName: string,
    assetType: any,
    content: unknown,
    previousHash?: string

  ) {

    const record = await processIntegrity(
      assetName,
      assetType,
      content,
      previousHash
    )

    return record
  }

  return {
    createIntegrityRecord
  }

}