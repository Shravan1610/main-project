import { IntegrityRecord } from "../types/integrity.types"

const ledgerDatabase: IntegrityRecord[] = []

export function findLedgerRecord(hash: string) {

  return ledgerDatabase.find(
    record => record.hash === hash
  )

}

export function storeLedgerRecord(record: IntegrityRecord) {

  ledgerDatabase.push(record)

}