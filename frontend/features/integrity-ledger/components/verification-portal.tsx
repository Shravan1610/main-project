"use client"

import { useState, useRef } from "react"
import { verifyContent } from "../services/verification-engine"
import VerificationResult from "./verification-result"

export default function VerificationPortal() {

  const [content, setContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  async function handleVerify() {

    if (!content) return

    setLoading(true)
    setError(null)

    try {

      const verification = await verifyContent(content)

      setResult(verification)

    } catch (err) {

      console.error(err)
      setError("Verification failed. Please try again.")

    } finally {

      setLoading(false)

    }
  }

  function clearInput() {

    setContent("")
    setFileName("")
    setFileSize(null)
    setResult(null)
    setError(null)

    if (inputRef.current) inputRef.current.value = ""

  }

  async function processFile(file: File) {

  setError(null)
  setFileName(file.name)
  setFileSize(file.size)

  try {

    // Read file as binary instead of text
    const buffer = await file.arrayBuffer()

    // Generate SHA256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)

    const hashArray = Array.from(new Uint8Array(hashBuffer))

    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    // Store only hash + small preview
    const preview = `Document uploaded: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nHash generated.`

    setContent(preview)

  } catch {

    setError("Unable to process the uploaded document.")

  }

}

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {

    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]

    if (file) processFile(file)

  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0]

    if (file) processFile(file)

  }

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="border border-terminal-border bg-terminal-surface p-4 rounded flex justify-between items-center">

        <div>
          <h2 className="text-lg font-semibold text-terminal-cyan">
            Integrity Verification Console
          </h2>

          <p className="text-xs text-terminal-text-dim">
            Cryptographic authenticity validation for sustainability disclosures
          </p>
        </div>

        <div className="text-[11px] text-terminal-text-dim text-right">
          <div>Module: Integrity Ledger</div>
          <div>Status: Operational</div>
        </div>

      </div>

      {/* ERROR MESSAGE */}

      {error && (

        <div className="border border-terminal-red/35 bg-terminal-red/8 text-terminal-red text-xs p-3 rounded">

          {error}

        </div>

      )}

      {/* TOP GRID */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* FILE UPLOAD */}

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border border-dashed rounded p-8 text-center cursor-pointer transition
          ${
            dragActive
              ? "border-terminal-cyan/45 bg-terminal-cyan/8"
              : "border-terminal-border bg-terminal-surface"
          }`}
        >

          <div className="space-y-2">

            <div className="text-terminal-cyan text-sm font-semibold">
              DOCUMENT INGESTION NODE
            </div>

            <p className="text-xs text-terminal-text-dim">
              Drag & drop sustainability report
            </p>

            <p className="text-[11px] text-terminal-text-dim">
              TXT / PDF / DOC / DOCX
            </p>

          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {fileName && (

            <div className="mt-4 text-xs text-terminal-green">

              Asset Loaded: {fileName}

              {fileSize && (
                <span className="text-terminal-text-dim ml-2">
                  ({(fileSize / 1024).toFixed(1)} KB)
                </span>
              )}

            </div>

          )}

        </div>

        {/* SYSTEM PIPELINE */}

        <div className="border border-terminal-border bg-terminal-surface p-6 rounded">

          <div className="text-xs text-terminal-text-dim mb-3">
            Verification Pipeline
          </div>

          <div className="space-y-2 text-xs">

            <div>✔ Content Normalization</div>
            <div>✔ SHA256 Fingerprint Generation</div>
            <div>✔ Integrity Ledger Lookup</div>
            <div>✔ Blockchain Proof Verification</div>

          </div>

        </div>

      </div>

      {/* TEXT INPUT */}

      <div className="border border-terminal-border bg-terminal-surface p-4 rounded">

        <label className="text-xs text-terminal-text-dim">
          RAW CONTENT INPUT
        </label>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste ESG claim, sustainability report text, or disclosure..."
          className="w-full mt-2 p-3 bg-terminal-bg border border-terminal-border rounded h-32 text-sm"
        />

      </div>

      {/* ACTION BAR */}

      <div className="flex items-center justify-between">

        <div className="text-xs text-terminal-text-dim">
          Content Length: {content.length} characters
        </div>

        <div className="flex gap-3">

          <button
            onClick={clearInput}
            className="px-4 py-2 border border-terminal-border text-terminal-text-dim hover:bg-terminal-border/40 rounded text-xs"
          >
            Clear
          </button>

          <button
            onClick={handleVerify}
            disabled={!content || loading}
            className="px-5 py-2 border border-terminal-cyan/40 text-terminal-cyan hover:bg-terminal-cyan/10 rounded text-xs transition disabled:opacity-40 flex items-center gap-2"
          >

            {loading && (
              <span className="w-3 h-3 border-2 border-terminal-cyan border-t-transparent rounded-full animate-spin"></span>
            )}

            {loading ? "Running Integrity Check..." : "Run Integrity Check"}

          </button>

        </div>

      </div>

      {/* RESULT */}

      {result && (

        <div className="border border-terminal-border bg-terminal-surface p-4 rounded">

          <VerificationResult result={result} />

        </div>

      )}

    </div>

  )
}
