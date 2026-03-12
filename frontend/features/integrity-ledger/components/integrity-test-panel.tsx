"use client"

import { useState, useRef } from "react"
import { useIntegrityLedger } from "../hooks/use-integrity-ledger"

export default function IntegrityTestPanel() {

  const { createIntegrityRecord } = useIntegrityLedger()

  const [content, setContent] = useState("Net zero by 2035")
  const [record, setRecord] = useState<any>(null)

  // persists between renders
  const previousHashRef = useRef<string | undefined>(undefined)

  async function runTest() {

    const result = await createIntegrityRecord(
      "Tesla ESG Report",
      "document",
      content,
      previousHashRef.current
    )

    // store latest hash
    previousHashRef.current = result.hash

    console.log("Integrity Record:", result)

    setRecord(result)
  }

  return (

    <div className="rounded-lg border border-terminal-border bg-terminal-surface p-4 text-terminal-text">

      <h2 className="text-lg font-semibold mb-2">
        Integrity Engine Test
      </h2>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-2 w-full rounded border border-terminal-border bg-terminal-bg px-2 py-2 text-terminal-text"
      />

      <button
        onClick={runTest}
        className="rounded border border-terminal-green/35 bg-terminal-green/8 px-4 py-2 text-terminal-green"
      >
        Generate Integrity Record
      </button>

      {record && (
        <pre className="mt-3 rounded border border-terminal-border bg-terminal-bg p-2 text-sm text-terminal-text">
          {JSON.stringify(record, null, 2)}
        </pre>
      )}

    </div>

  )
}
