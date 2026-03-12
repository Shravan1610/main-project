"use client"

import { useState, useRef } from "react"
import { useIntegrity } from "../hooks/use-integrity"
import IntegrityDashboard from "./integrity-dashboard"
import IntegrityCard from "./integrity-card"
import VersionTimeline from "./version-timeline"
import IntegrityTimeline from "./integrity-timeline"
import VerificationPortal from "./verification-portal"
import type { AssetType, IntegrityRecord } from "../types/integrity.types"

type Tab = "submit" | "records" | "events" | "verify"

const ASSET_TYPES: AssetType[] = [
  "document",
  "digital",
  "blockchain",
  "webpage",
  "crypto",
]

export default function IntegrityLedgerPanel() {

  const { records, events, loading, error, submitDocument } = useIntegrity()

  const [activeTab, setActiveTab] = useState<Tab>("submit")
  const [assetName, setAssetName] = useState("Tesla ESG Report")
  const [assetType, setAssetType] = useState<AssetType>("document")
  const [content, setContent] = useState("Net zero by 2035")
  const [lastRecord, setLastRecord] = useState<IntegrityRecord | null>(null)
  const [fileName, setFileName] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const latestRecord = records[records.length - 1]

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "submit", label: "Submit Document" },
    { key: "records", label: "Records", badge: records.length },
    { key: "events", label: "Event Trail", badge: events.length },
    { key: "verify", label: "Verify" },
  ]

  async function handleSubmit() {
    if (!assetName.trim() || !content.trim()) return
    const record = await submitDocument(assetName, assetType, content)
    setLastRecord(record)
    setActiveTab("records")
  }

  async function processFile(file: File) {
    setFileName(file.name)
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    setContent(
      `Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nFingerprint: ${hashHex}`
    )
    if (!assetName || assetName === "Tesla ESG Report") {
      setAssetName(file.name.replace(/\.[^/.]+$/, ""))
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

    <div className="rounded-xl border border-terminal-border bg-terminal-surface text-terminal-text overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b border-terminal-border px-5 py-4">

        <div>
          <h2 className="text-base font-semibold text-terminal-cyan">
            Integrity Ledger
          </h2>
          <p className="text-xs text-terminal-text-dim mt-0.5">
            Cryptographic tamper-proof audit layer for sustainability documents
          </p>
        </div>

        <div className="text-[11px] text-terminal-text-dim text-right space-y-0.5 shrink-0">
          <div>Records: {records.length}</div>
          <div>Events: {events.length}</div>
          <div className="text-terminal-green">Status: Active</div>
        </div>

      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-terminal-border px-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-4 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-terminal-cyan border-b-2 border-terminal-cyan -mb-px"
                : "text-terminal-text-dim hover:text-terminal-text"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-terminal-border text-terminal-text-dim">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="p-5">

        {/* ─── SUBMIT TAB ─── */}
        {activeTab === "submit" && (

          <div className="space-y-5">

            <p className="text-xs text-terminal-text-dim">
              Ingest a sustainability document to generate its SHA-256 fingerprint,
              create an immutable ledger record, and anchor it to the blockchain.
            </p>

            {error && (
              <div className="border border-terminal-red/35 bg-terminal-red/8 text-terminal-red text-xs p-3 rounded">
                {error}
              </div>
            )}

            {/* File drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded p-5 text-center cursor-pointer transition ${
                dragActive
                  ? "border-terminal-cyan/50 bg-terminal-cyan/8"
                  : "border-terminal-border bg-terminal-bg hover:border-terminal-cyan/30"
              }`}
            >
              <p className="text-xs font-semibold text-terminal-cyan">
                DOCUMENT INGESTION NODE
              </p>
              <p className="text-[11px] text-terminal-text-dim mt-1">
                Drag & drop  ·  TXT / PDF / DOC / DOCX
              </p>
              {fileName && (
                <p className="mt-2 text-xs text-terminal-green">
                  Loaded: {fileName}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Form fields */}
            <div className="grid gap-3">

              <div>
                <label className="text-xs text-terminal-text-dim block mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text focus:outline-none focus:border-terminal-cyan"
                  placeholder="e.g. Tesla ESG Report 2025"
                />
              </div>

              <div>
                <label className="text-xs text-terminal-text-dim block mb-1">
                  Asset Type
                </label>
                <select
                  value={assetType}
                  onChange={e => setAssetType(e.target.value as AssetType)}
                  className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text focus:outline-none focus:border-terminal-cyan"
                >
                  {ASSET_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-terminal-text-dim block mb-1">
                  Document Content
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={5}
                  className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text focus:outline-none focus:border-terminal-cyan resize-none"
                  placeholder="Paste sustainability report, ESG disclosure, or climate commitment…"
                />
                <p className="text-[11px] text-terminal-text-dim mt-1">
                  {content.length} characters
                </p>
              </div>

            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !assetName.trim() || !content.trim()}
              className="flex items-center gap-2 rounded border border-terminal-cyan/40 bg-terminal-cyan/8 px-5 py-2 text-sm text-terminal-cyan transition hover:bg-terminal-cyan/15 disabled:opacity-40"
            >
              {loading && (
                <span className="w-3 h-3 border-2 border-terminal-cyan border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Processing…" : "Generate Integrity Record"}
            </button>

            {/* Last created record preview */}
            {lastRecord && (
              <div className="border border-terminal-green/30 bg-terminal-green/5 rounded p-4 space-y-2">
                <p className="text-xs font-semibold text-terminal-green">
                  Record Created — v{lastRecord.version}
                </p>
                <div>
                  <p className="text-[11px] text-terminal-text-dim mb-0.5">SHA256</p>
                  <p className="font-mono text-[11px] text-terminal-cyan break-all">
                    {lastRecord.hash}
                  </p>
                </div>
                {lastRecord.blockchainTx && (
                  <div>
                    <p className="text-[11px] text-terminal-text-dim mb-0.5">Blockchain TX</p>
                    <p className="font-mono text-[11px] text-terminal-green break-all">
                      {lastRecord.blockchainTx}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

        )}

        {/* ─── RECORDS TAB ─── */}
        {activeTab === "records" && (

          <div className="space-y-5">

            {records.length === 0 ? (

              <p className="text-sm text-terminal-text-dim">
                No records yet. Submit a document to create an integrity record.
              </p>

            ) : (

              <>

                {/* Dashboard for the latest record */}
                {latestRecord && (
                  <IntegrityDashboard record={latestRecord} events={events} />
                )}

                {/* All records */}
                {records.length > 1 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-terminal-text-dim uppercase tracking-wide">
                      All Records ({records.length})
                    </h3>
                    {[...records].reverse().map(r => (
                      <IntegrityCard key={r.id} record={r} />
                    ))}
                  </div>
                )}

                {/* Version chain */}
                <VersionTimeline records={records} />

              </>

            )}

          </div>

        )}

        {/* ─── EVENTS TAB ─── */}
        {activeTab === "events" && (

          <div>

            {events.length === 0 ? (

              <p className="text-sm text-terminal-text-dim">
                No events recorded yet. Events are emitted as documents are submitted.
              </p>

            ) : (

              <div className="space-y-5">

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-terminal-text">
                    Integrity Event Trail
                  </h3>
                  <span className="text-[11px] text-terminal-text-dim">
                    {events.length} events
                  </span>
                </div>

                {/* Categorised counts */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      { type: "DOCUMENT_HASH_CREATED", label: "Created", color: "terminal-cyan" },
                      { type: "BLOCKCHAIN_PROOF_RECORDED", label: "Anchored", color: "terminal-green" },
                      { type: "DOCUMENT_VERSION_UPDATED", label: "Updated", color: "terminal-amber" },
                      { type: "DOCUMENT_TAMPER_ALERT", label: "Tampered", color: "terminal-red" },
                    ] as const
                  ).map(({ type, label, color }) => {
                    const count = events.filter(e => e.type === type).length
                    return (
                      <div
                        key={type}
                        className="rounded border border-terminal-border bg-terminal-bg p-3 text-center"
                      >
                        <p className={`text-xl font-bold text-${color}`}>{count}</p>
                        <p className="text-[11px] text-terminal-text-dim mt-0.5">{label}</p>
                      </div>
                    )
                  })}
                </div>

                <IntegrityTimeline events={events} />

              </div>

            )}

          </div>

        )}

        {/* ─── VERIFY TAB ─── */}
        {activeTab === "verify" && (

          <VerificationPortal />

        )}

      </div>

    </div>

  )

}
