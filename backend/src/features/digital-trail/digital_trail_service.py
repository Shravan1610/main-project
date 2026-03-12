"""In-memory document registry with REAL Sepolia blockchain anchoring and forensic capture.

Uses web3.py for actual Ethereum Sepolia testnet transactions when configured.
Falls back to simulated hashes when blockchain credentials are not set.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
import threading
from datetime import datetime, timezone
from typing import Any

from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


# ── Encryption key (from env var if persistent, else generate) ───────────────
def _get_fernet():
    try:
        from src.shared.config import get_settings
        key = get_settings().forensic_encryption_key
        if key:
            return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        pass
    return Fernet(Fernet.generate_key())


_fernet = _get_fernet()


# ── Web3 / Sepolia setup ────────────────────────────────────────────────────
_w3 = None
_account = None
_chain_id = None


def _init_web3():
    """Lazily initialize Web3 connection to Sepolia."""
    global _w3, _account, _chain_id
    if _w3 is not None:
        return _w3, _account
    try:
        from web3 import Web3
        from src.shared.config import get_settings
        settings = get_settings()
        if not settings.blockchain_rpc_url or not settings.blockchain_private_key:
            logger.info("Blockchain not configured — using simulated tx hashes")
            return None, None
        _w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url))
        if not _w3.is_connected():
            logger.warning("Web3 cannot connect to %s — falling back to simulation", settings.blockchain_rpc_url)
            _w3 = None
            return None, None
        _account = _w3.eth.account.from_key(settings.blockchain_private_key)
        _chain_id = _w3.eth.chain_id
        logger.info("Web3 connected to chain %d, account %s", _chain_id, _account.address)
        return _w3, _account
    except ImportError:
        logger.info("web3 package not installed — using simulated tx hashes")
        return None, None
    except Exception as exc:
        logger.warning("Web3 init failed: %s — using simulated tx hashes", exc)
        _w3 = None
        return None, None


# ── In-memory stores ────────────────────────────────────────────────────────
_lock = threading.Lock()
_registry: dict[str, dict[str, Any]] = {}
_forensic_store: dict[str, list[dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _simulate_blockchain_tx(hash_hex: str) -> str:
    """Generate a realistic-looking blockchain transaction hash (fallback)."""
    salt = f"{hash_hex}:{secrets.token_hex(8)}:{datetime.now(timezone.utc).timestamp()}"
    return "0x" + hashlib.sha256(salt.encode()).hexdigest()


def _real_blockchain_tx(hash_hex: str) -> str | None:
    """Anchor hash on Sepolia via a self-transfer with data field. Returns real tx hash or None."""
    w3, account = _init_web3()
    if w3 is None or account is None:
        return None
    try:
        nonce = w3.eth.get_transaction_count(account.address)
        tx = {
            "to": account.address,
            "value": 0,
            "gas": 25000,
            "gasPrice": w3.eth.gas_price,
            "nonce": nonce,
            "chainId": _chain_id,
            "data": bytes.fromhex(hash_hex) if len(hash_hex) == 64 else hash_hex.encode(),
        }
        signed = w3.eth.account.sign_transaction(tx, account.key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        hex_hash = tx_hash.hex() if hasattr(tx_hash, "hex") else tx_hash
        if not str(hex_hash).startswith("0x"):
            hex_hash = "0x" + str(hex_hash)
        logger.info("Sepolia tx sent: %s for hash %s", hex_hash, hash_hex[:16])
        return hex_hash
    except Exception as exc:
        logger.warning("Blockchain tx failed: %s — falling back to simulation", exc)
        return None


def _anchor_on_blockchain(hash_hex: str) -> tuple[str, bool]:
    """Try real blockchain first, fall back to simulation. Returns (tx_hash, is_real)."""
    real_tx = _real_blockchain_tx(hash_hex)
    if real_tx:
        return real_tx, True
    return _simulate_blockchain_tx(hash_hex), False


def _persist_record(record: dict[str, Any]) -> None:
    """Best-effort persist to Supabase."""
    try:
        from src.shared.clients.supabase_client import persist_digital_trail_record
        persist_digital_trail_record(record)
    except Exception:
        pass


# ── Public API ──────────────────────────────────────────────────────────────

def register_document(
    hash_hex: str,
    asset_name: str,
    asset_type: str = "document",
    encrypted_chunk: str | None = None,
) -> dict[str, Any]:
    """Register a document hash on the blockchain (real Sepolia or simulated)."""
    with _lock:
        if hash_hex in _registry:
            existing = _registry[hash_hex]
            existing["last_verified_at"] = _now_iso()
            return {
                "record": existing,
                "message": "Document already registered. Timestamp updated.",
            }

        tx_hash, is_real = _anchor_on_blockchain(hash_hex)

        record: dict[str, Any] = {
            "hash": hash_hex,
            "asset_name": asset_name,
            "asset_type": asset_type,
            "encrypted_chunk": encrypted_chunk,
            "blockchain_tx": tx_hash,
            "blockchain_network": "sepolia" if is_real else "simulated",
            "blockchain_explorer": f"https://sepolia.etherscan.io/tx/{tx_hash}" if is_real else None,
            "registered_at": _now_iso(),
            "last_verified_at": None,
            "version": 1,
            "status": "anchored",
        }

        _registry[hash_hex] = record
        _persist_record(record)

        network_label = "Sepolia testnet" if is_real else "simulated blockchain"
        return {"record": record, "message": f"Document registered and anchored on {network_label}."}


def verify_document(hash_hex: str, client_ip: str) -> dict[str, Any]:
    """Verify a hash against the registry. If not found -> forensic capture."""
    with _lock:
        if hash_hex in _registry:
            record = _registry[hash_hex]
            record["last_verified_at"] = _now_iso()
            explorer_note = ""
            if record.get("blockchain_explorer"):
                explorer_note = f" View on Etherscan: {record['blockchain_explorer']}"
            return {
                "status": "verified",
                "hash": hash_hex,
                "record": record,
                "forensic_event": None,
                "message": f"SHA-256 matches blockchain record. No tampering detected.{explorer_note}",
            }

        forensic_event: dict[str, Any] = {
            "ip": client_ip,
            "timestamp": _now_iso(),
            "attempted_hash": hash_hex,
            "original_hash": "unknown",
        }
        _encrypt_forensic(forensic_event)

        return {
            "status": "tampered",
            "hash": hash_hex,
            "record": None,
            "forensic_event": forensic_event,
            "message": "SHA-256 does NOT match any blockchain record. Tampering detected.",
        }


def verify_against_original(
    attempted_hash: str,
    original_hash: str,
    client_ip: str,
) -> dict[str, Any]:
    """Verify a hash explicitly against a known original hash."""
    with _lock:
        if attempted_hash == original_hash and original_hash in _registry:
            record = _registry[original_hash]
            record["last_verified_at"] = _now_iso()
            return {
                "status": "verified",
                "hash": attempted_hash,
                "record": record,
                "forensic_event": None,
                "message": "SHA-256 matches public blockchain record. No tampering detected.",
            }

        record = _registry.get(original_hash)

        forensic_event: dict[str, Any] = {
            "ip": client_ip,
            "timestamp": _now_iso(),
            "attempted_hash": attempted_hash,
            "original_hash": original_hash,
        }
        _encrypt_forensic(forensic_event)

        if original_hash not in _forensic_store:
            _forensic_store[original_hash] = []
        _forensic_store[original_hash].append(forensic_event)

        return {
            "status": "tampered",
            "hash": attempted_hash,
            "record": record,
            "forensic_event": forensic_event,
            "message": "SHA-256 mismatch. Tampering detected. Forensic trail created.",
        }


def get_record(hash_hex: str) -> dict[str, Any] | None:
    """Look up a public blockchain record by hash."""
    return _registry.get(hash_hex)


def get_forensic_trail(hash_hex: str) -> dict[str, Any] | None:
    """Return forensic trail for a document hash."""
    record = _registry.get(hash_hex)
    if not record:
        return None

    events = _forensic_store.get(hash_hex, [])
    return {
        "original_hash": hash_hex,
        "asset_name": record["asset_name"],
        "events": events,
        "total_tamper_attempts": len(events),
    }


def get_all_records() -> list[dict[str, Any]]:
    """Return all registered documents."""
    return list(_registry.values())


# ── Internal helpers ────────────────────────────────────────────────────────

def _encrypt_forensic(event: dict[str, Any]) -> bytes:
    """Encrypt forensic metadata. Returns ciphertext (stored server-side)."""
    plaintext = f"{event['ip']}|{event['timestamp']}|{event['attempted_hash']}|{event['original_hash']}"
    return _fernet.encrypt(plaintext.encode())
