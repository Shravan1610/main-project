"use client";

import { useState, useRef, useCallback } from "react";
import { MacWindow } from "@/shared/components/mac-window";
import { useIntegrity } from "@/features/integrity-ledger/hooks/use-integrity";
import type { IntegrityRecord } from "@/features/integrity-ledger/types/integrity.types";
import { VerificationFlow } from "./verification-flow";
import { BlockchainRecordCard } from "./blockchain-record-card";
import { ForensicTrailCard } from "./forensic-trail-card";

type PipelineStep = {
  label: string;
  detail: string;
  status: "pending" | "active" | "done" | "error";
};

const INITIAL_STEPS: PipelineStep[] = [
  { label: "Document Upload", detail: "Waiting for file…", status: "pending" },
  { label: "SHA-256 Hash", detail: "Compute cryptographic fingerprint", status: "pending" },
  { label: "PDF Chunk Encrypted", detail: "AES-GCM encrypt first 1 KB", status: "pending" },
  { label: "Blockchain Anchor", detail: "Record hash on-chain as public record", status: "pending" },
  { label: "Verification", detail: "Compare against blockchain record", status: "pending" },
];

export function DataTrailWorkspace() {
  const {
    submitFile,
    verifyFile,
    loading,
    error,
    verificationResult,
    forensicTrail,
  } = useIntegrity();

  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [registeredRecord, setRegisteredRecord] = useState<IntegrityRecord | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [tamperResult, setTamperResult] = useState<boolean | undefined>(undefined);
  const [mode, setMode] = useState<"register" | "verify">("register");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  // ── Register a new document ──────────────────────────────────────────────
  const handleRegister = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setTamperResult(undefined);
      setSteps((prev) => prev.map((s) => ({ ...s, status: "pending" as const })));

      // Step 1: Upload
      updateStep(0, "active", `Processing ${file.name}…`);
      await sleep(300);
      updateStep(0, "done", file.name);

      // Step 2: SHA-256
      updateStep(1, "active", "Computing SHA-256 hash…");
      await sleep(400);

      // Step 3-4-5 happen inside submitFile
      updateStep(1, "done", "SHA-256 computed");
      updateStep(2, "active", "Encrypting first 1 KB with AES-GCM…");
      await sleep(300);
      updateStep(2, "done", "Chunk encrypted");
      updateStep(3, "active", "Anchoring on blockchain…");

      try {
        const record = await submitFile(file, file.name);
        updateStep(3, "done", `TX: ${record.blockchainTx?.slice(0, 18)}…`);
        updateStep(4, "done", "Document registered as public record");
        setRegisteredRecord(record);
      } catch {
        updateStep(3, "error", "Registration failed");
      }
    },
    [submitFile],
  );

  // ── Verify an existing document ──────────────────────────────────────────
  const handleVerify = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setSteps((prev) => prev.map((s) => ({ ...s, status: "pending" as const })));

      // Step 1: Upload
      updateStep(0, "active", `Re-uploading ${file.name}…`);
      await sleep(300);
      updateStep(0, "done", file.name);

      // Step 2: SHA-256
      updateStep(1, "active", "Re-computing SHA-256 hash…");
      await sleep(400);
      updateStep(1, "done", "SHA-256 computed");

      // Step 3: Skip chunk encryption for verification
      updateStep(2, "done", "Skipped (verification only)");

      // Step 4: Blockchain lookup
      updateStep(3, "active", "Checking blockchain record…");

      try {
        const result = await verifyFile(file, registeredRecord?.hash);
        if (result.status === "verified") {
          updateStep(3, "done", "Hash matches blockchain record");
          updateStep(4, "done", "No tampering detected — timestamp updated");
          setTamperResult(false);
        } else {
          updateStep(3, "error", "Hash MISMATCH detected");
          updateStep(4, "error", "Tampering detected — forensic trail created");
          setTamperResult(true);
        }
      } catch {
        updateStep(3, "error", "Verification failed");
        updateStep(4, "error", "Could not complete verification");
      }
    },
    [verifyFile, registeredRecord],
  );

  // ── Simulate tampering for demo ──────────────────────────────────────────
  const handleSimulateTamper = useCallback(async () => {
    if (!registeredRecord) return;

    setSteps((prev) => prev.map((s) => ({ ...s, status: "pending" as const })));
    updateStep(0, "active", "Simulating tampered document…");
    await sleep(300);
    updateStep(0, "done", `${fileName} (modified)`);

    updateStep(1, "active", "Computing SHA-256 of tampered content…");
    await sleep(400);
    updateStep(1, "done", "SHA-256 computed (different from original)");

    updateStep(2, "done", "Skipped (verification only)");
    updateStep(3, "active", "Checking blockchain record…");

    // Create a fake modified hash by flipping a character
    const fakeHash = registeredRecord.hash.slice(0, -1) +
      (registeredRecord.hash.endsWith("0") ? "1" : "0");

    try {
      // Directly call the backend verify with the fake hash
      const { verifyDocument: verifyDocApi } = await import(
        "@/features/integrity-ledger/services/digital-trail-api"
      );
      const result = await verifyDocApi(fakeHash, registeredRecord.hash);

      updateStep(3, "error", "Hash MISMATCH detected");
      updateStep(4, "error", "Tampering detected — IP + timestamp captured");
      setTamperResult(true);

      // Refresh forensic trail
      const { getForensicTrail: getTrail } = await import(
        "@/features/integrity-ledger/services/digital-trail-api"
      );
      try {
        await getTrail(registeredRecord.hash);
      } catch {
        // non-critical
      }
    } catch {
      updateStep(3, "error", "Simulation failed — backend unavailable");
    }
  }, [registeredRecord, fileName]);

  // ── Helper to update a specific step ─────────────────────────────────────
  function updateStep(index: number, status: PipelineStep["status"], detail: string) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status, detail } : s)),
    );
  }

  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ── Drag & drop handler ──────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (mode === "register") handleRegister(file);
      else handleVerify(file);
    },
    [mode, handleRegister, handleVerify],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (mode === "register") handleRegister(file);
      else handleVerify(file);
    },
    [mode, handleRegister, handleVerify],
  );

  return (
    <section className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <MacWindow title="Digital Trail — Blockchain Document Integrity" bodyClassName="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
              Digital Trail
            </p>
            <h3 className="text-lg font-semibold tracking-wide text-terminal-text">
              Upload, verify, and trace document integrity through blockchain anchoring.
            </h3>
            <p className="max-w-3xl text-sm text-terminal-text-dim">
              Documents are hashed with SHA-256 and anchored on-chain. Re-upload to verify —
              if tampered, the system captures IP address and timestamp as encrypted forensic metadata.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-terminal-border bg-terminal-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Hash</p>
              <p className="mt-1 text-sm text-terminal-cyan">SHA-256</p>
            </div>
            <div className="rounded-lg border border-terminal-border bg-terminal-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Encryption</p>
              <p className="mt-1 text-sm text-terminal-cyan">AES-GCM</p>
            </div>
            <div className="rounded-lg border border-terminal-border bg-terminal-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Record</p>
              <p className="mt-1 text-sm text-terminal-cyan">Blockchain</p>
            </div>
          </div>
        </div>
      </MacWindow>

      {/* ── Mode Selector + Upload ──────────────────────────────────────── */}
      <MacWindow title="Document Ingestion" bodyClassName="p-4">
        {/* Mode toggle */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
              mode === "register"
                ? "border-terminal-green/35 bg-terminal-green/8 text-terminal-green"
                : "border-terminal-border text-terminal-text-dim hover:bg-terminal-border/35"
            }`}
          >
            Register New Document
          </button>
          <button
            type="button"
            onClick={() => setMode("verify")}
            disabled={!registeredRecord}
            className={`rounded border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
              mode === "verify"
                ? "border-terminal-cyan/35 bg-terminal-cyan/8 text-terminal-cyan"
                : "border-terminal-border text-terminal-text-dim hover:bg-terminal-border/35"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Verify Existing Document
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-xl border-2 border-dashed border-terminal-border bg-terminal-bg/30 p-8 text-center transition-colors hover:border-terminal-cyan/40"
        >
          <p className="text-sm text-terminal-text-dim">
            {mode === "register"
              ? "Drag & drop a document to register on blockchain"
              : "Drag & drop a document to verify against blockchain record"}
          </p>
          <p className="mt-1 text-[11px] text-terminal-text-muted">
            PDF, DOC, DOCX, TXT, or any file
          </p>

          <input
            ref={mode === "register" ? fileInputRef : verifyInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() =>
              (mode === "register" ? fileInputRef : verifyInputRef).current?.click()
            }
            disabled={loading}
            className="mt-3 rounded border border-terminal-cyan/35 bg-terminal-cyan/8 px-4 py-2 text-xs text-terminal-cyan hover:bg-terminal-cyan/15 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing…" : "Browse Files"}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-terminal-red">{error}</p>
        )}
      </MacWindow>

      {/* ── Verification Pipeline ───────────────────────────────────────── */}
      <MacWindow title="Verification Pipeline" bodyClassName="p-4">
        <VerificationFlow steps={steps} tampered={tamperResult} />

        {/* How it works explanation */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-terminal-border bg-terminal-surface px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-green">✓ If Hash Matches</p>
            <p className="mt-1 text-[11px] text-terminal-text-dim">
              SHA-256 matches the blockchain public record. Timestamp is updated. No tampering.
            </p>
          </div>
          <div className="rounded-lg border border-terminal-border bg-terminal-surface px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-red">✗ If Hash Differs</p>
            <p className="mt-1 text-[11px] text-terminal-text-dim">
              SHA-256 doesn&apos;t match. System secretly captures IP + timestamp as encrypted metadata on the digital asset.
            </p>
          </div>
        </div>
      </MacWindow>

      {/* ── Blockchain Record (after registration) ──────────────────────── */}
      {registeredRecord && (
        <MacWindow title="Blockchain Public Record" bodyClassName="p-4">
          <BlockchainRecordCard
            hash={registeredRecord.hash}
            assetName={registeredRecord.assetName}
            blockchainTx={registeredRecord.blockchainTx}
            blockchainNetwork={registeredRecord.blockchainNetwork}
            blockchainExplorer={registeredRecord.blockchainExplorer}
            registeredAt={new Date(registeredRecord.timestamp).toISOString()}
            lastVerifiedAt={registeredRecord.lastVerifiedAt ? new Date(registeredRecord.lastVerifiedAt).toISOString() : null}
            version={registeredRecord.version}
            status={registeredRecord.blockchainTx ? "anchored" : "pending"}
            encryptedChunk={registeredRecord.encryptedChunk}
          />
        </MacWindow>
      )}

      {/* ── Forensic Trail (only when tampering detected) ───────────────── */}
      {tamperResult && (
        <MacWindow title="Forensic Trail — Encrypted Evidence" bodyClassName="p-4">
          <ForensicTrailCard
            events={
              verificationResult?.forensicEvent
                ? [verificationResult.forensicEvent]
                : forensicTrail
            }
            encryptedBlob={registeredRecord?.forensicMetadata}
            totalAttempts={
              forensicTrail.length ||
              (verificationResult?.forensicEvent ? 1 : 0)
            }
          />
        </MacWindow>
      )}

      {/* ── Demo Controls ───────────────────────────────────────────────── */}
      {registeredRecord && (
        <MacWindow title="Demo Controls" bodyClassName="p-4">
          <p className="mb-3 text-[11px] text-terminal-text-dim">
            Use these controls to demonstrate the tampering detection flow.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSimulateTamper}
              disabled={loading}
              className="rounded border border-terminal-red/35 bg-terminal-red/8 px-4 py-2 text-xs text-terminal-red hover:bg-terminal-red/15 transition-colors disabled:opacity-50"
            >
              Simulate Tampering
            </button>
            <button
              type="button"
              onClick={() => {
                setTamperResult(undefined);
                setSteps(INITIAL_STEPS);
                setRegisteredRecord(null);
                setFileName("");
                setMode("register");
              }}
              className="rounded border border-terminal-border px-4 py-2 text-xs text-terminal-text-dim hover:bg-terminal-border/35 transition-colors"
            >
              Reset
            </button>
          </div>
        </MacWindow>
      )}
    </section>
  );
}
