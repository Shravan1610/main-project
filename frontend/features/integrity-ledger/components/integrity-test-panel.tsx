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

    <div className="p-4 border rounded-lg bg-slate-900">

      <h2 className="text-lg font-semibold mb-2">
        Integrity Engine Test
      </h2>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 bg-black border rounded mb-2"
      />

      <button
        onClick={runTest}
        className="px-4 py-2 bg-green-600 rounded"
      >
        Generate Integrity Record
      </button>

      {record && (
        <pre className="mt-3 text-sm bg-black p-2 rounded">
          {JSON.stringify(record, null, 2)}
        </pre>
      )}

    </div>

  )
}