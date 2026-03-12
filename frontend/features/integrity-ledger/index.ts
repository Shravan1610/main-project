// ── Panels & Portals ───────────────────────────────────────────────────────
export { default as IntegrityLedgerPanel } from "./components/integrity-ledger-panel"
export { default as IntegrityDashboard } from "./components/integrity-dashboard"
export { default as VerificationPortal } from "./components/verification-portal"

// ── Cards & Badges ─────────────────────────────────────────────────────────
export { default as IntegrityCard } from "./components/integrity-card"
export { default as IntegrityScoreCard } from "./components/integrity-score-card"
export { default as VerificationBadge } from "./components/verification-badge"
export { default as BlockchainVerificationBadge } from "./components/blockchain-verification-badge"

// ── Timelines & Alerts ─────────────────────────────────────────────────────
export { default as IntegrityTimeline } from "./components/integrity-timeline"
export { default as VersionTimeline } from "./components/version-timeline"
export { default as TamperAlert } from "./components/tamper-alert"
export { default as VerificationResult } from "./components/verification-result"

// ── Test / Dev ─────────────────────────────────────────────────────────────
export { default as IntegrityTestPanel } from "./components/integrity-test-panel"

// ── Hooks & Types ──────────────────────────────────────────────────────────
export { useIntegrity } from "./hooks/use-integrity"
export { useIntegrityLedger } from "./hooks/use-integrity-ledger"
export type { ForensicEventUI, VerificationResultUI } from "./hooks/use-integrity"

// ── Types ──────────────────────────────────────────────────────────────────
export type { IntegrityRecord, AssetType } from "./types/integrity.types"
export type { IntegrityEvent, IntegrityEventType } from "./types/integrity-events.types"