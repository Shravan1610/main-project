"use client";

import { useRef, useState } from "react";

import { verifyContent } from "../services/verification-engine";
import VerificationResult from "./verification-result";

type VerificationPortalProps = {
  compact?: boolean;
};

export default function VerificationPortal({ compact = false }: VerificationPortalProps) {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleVerify() {
    if (!content) return;

    setLoading(true);
    setError(null);

    try {
      const verification = await verifyContent(content);
      setResult(verification);
    } catch (err) {
      console.error(err);
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearInput() {
    setContent("");
    setFileName("");
    setFileSize(null);
    setResult(null);
    setError(null);

    if (inputRef.current) inputRef.current.value = "";
  }

  async function processFile(file: File) {
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

      const preview = `Document uploaded: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nHash: ${hashHex.slice(0, 24)}...`;
      setContent(preview);
    } catch {
      setError("Unable to process the uploaded document.");
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {!compact ? (
        <div className="flex items-center justify-between rounded border border-terminal-border bg-terminal-surface p-4">
          <div>
            <h2 className="text-lg font-semibold text-terminal-cyan">Integrity Verification Console</h2>
            <p className="text-xs text-terminal-text-dim">
              Cryptographic authenticity validation for sustainability disclosures
            </p>
          </div>

          <div className="text-right text-[11px] text-terminal-text-dim">
            <div>Module: Integrity Ledger</div>
            <div>Status: Operational</div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-terminal-red/35 bg-terminal-red/8 p-3 text-xs text-terminal-red">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border border-dashed p-8 text-center transition ${
            dragActive
              ? "border-terminal-cyan/45 bg-terminal-cyan/8"
              : "border-terminal-border bg-terminal-surface"
          }`}
        >
          <div className="space-y-2">
            <div className="text-sm font-semibold text-terminal-cyan">DOCUMENT INGESTION NODE</div>
            <p className="text-xs text-terminal-text-dim">Drag and drop a sustainability report or raw evidence.</p>
            <p className="text-[11px] text-terminal-text-dim">TXT / PDF / DOC / DOCX</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {fileName ? (
            <div className="mt-4 text-xs text-terminal-green">
              Asset Loaded: {fileName}
              {fileSize ? (
                <span className="ml-2 text-terminal-text-dim">({(fileSize / 1024).toFixed(1)} KB)</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-terminal-border bg-terminal-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-terminal-text-muted">Verification Pipeline</p>
            <span className="rounded-full border border-terminal-green/30 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-terminal-green">
              Online
            </span>
          </div>

          <div className="space-y-2 text-xs text-terminal-text">
            <div>01. Content normalization</div>
            <div>02. SHA-256 fingerprint generation</div>
            <div>03. Integrity ledger lookup</div>
            <div>04. Blockchain proof verification</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-surface p-4">
        <label className="text-xs text-terminal-text-dim">RAW CONTENT INPUT</label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste ESG claim, sustainability report text, or disclosure..."
          className="mt-2 h-32 w-full rounded border border-terminal-border bg-terminal-bg p-3 text-sm text-terminal-text"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-terminal-text-dim">Content Length: {content.length} characters</div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={clearInput}
            className="rounded border border-terminal-border px-4 py-2 text-xs text-terminal-text-dim transition hover:bg-terminal-border/40"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!content || loading}
            className="flex items-center gap-2 rounded border border-terminal-cyan/40 px-5 py-2 text-xs text-terminal-cyan transition hover:bg-terminal-cyan/10 disabled:opacity-40"
          >
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-terminal-cyan border-t-transparent" />
            ) : null}
            {loading ? "Running Integrity Check..." : "Run Integrity Check"}
          </button>
        </div>
      </div>

      {result ? (
        <div className="rounded border border-terminal-border bg-terminal-surface p-4">
          <VerificationResult result={result} />
        </div>
      ) : null}
    </div>
  );
}
