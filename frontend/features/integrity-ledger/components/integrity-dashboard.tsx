"use client"

import IntegrityScoreCard from "./integrity-score-card"
import BlockchainVerificationBadge from "./blockchain-verification-badge"
import TamperAlert from "./tamper-alert"
import IntegrityTimeline from "./integrity-timeline"

export default function IntegrityDashboard({ record, events }) {

  const tampered =
    record.previousHash &&
    record.previousHash !== record.hash

  return (

    <div className="grid gap-6">

      <IntegrityScoreCard
        hash={record.hash}
        version={record.version}
        blockchainTx={record.blockchainTx}
      />

      <BlockchainVerificationBadge tx={record.blockchainTx} />

      <TamperAlert tampered={tampered} />

      <IntegrityTimeline events={events} />

    </div>

  )

}