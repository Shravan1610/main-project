"""End-to-end tests for the Digital Trail feature.

These tests require a running backend at http://localhost:8000 and are
skipped automatically (via the ``live_api`` fixture) when the server is not
reachable, so they are safe to collect in CI without a live backend.
"""
import pytest
import requests

BASE = "http://localhost:8000"
HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TAMPERED = "0000000000000000000000000000000000000000000000000000000000000000"
UNKNOWN = "1111111111111111111111111111111111111111111111111111111111111111"


@pytest.fixture(scope="module")
def live_api():
    """Skip all tests in this module when the backend is not running."""
    try:
        requests.get(f"{BASE}/health", timeout=2)
    except requests.exceptions.ConnectionError:
        pytest.skip("Backend not running at http://localhost:8000")


def test_register_document(live_api):
    r = requests.post(f"{BASE}/digital-trail/register", json={
        "hash": HASH,
        "asset_name": "e2e-test-doc.pdf",
        "asset_type": "document",
        "encrypted_chunk": "dGVzdCBjaHVuaw==",
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    d = r.json()
    assert d["record"]["status"] == "anchored"
    assert d["record"]["blockchain_tx"].startswith("0x")
    assert "registered" in d["message"].lower()


def test_verify_matching_hash(live_api):
    r = requests.post(f"{BASE}/digital-trail/verify", json={"hash": HASH})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "verified", f"Expected verified, got {d['status']}"
    assert d["forensic_event"] is None
    assert d["record"]["last_verified_at"] is not None


def test_verify_tampered_hash(live_api):
    r = requests.post(f"{BASE}/digital-trail/verify", json={
        "hash": TAMPERED,
        "original_hash": HASH,
    })
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "tampered", f"Expected tampered, got {d['status']}"
    assert d["forensic_event"] is not None
    assert d["forensic_event"]["ip"]
    assert d["forensic_event"]["timestamp"]
    assert d["forensic_event"]["attempted_hash"] == TAMPERED
    assert d["forensic_event"]["original_hash"] == HASH


def test_get_record(live_api):
    r = requests.get(f"{BASE}/digital-trail/records/{HASH}")
    assert r.status_code == 200
    d = r.json()
    assert "record" in d
    assert d["record"]["asset_name"] == "e2e-test-doc.pdf"


def test_list_records(live_api):
    r = requests.get(f"{BASE}/digital-trail/records")
    assert r.status_code == 200
    d = r.json()
    assert d["total"] >= 1
    assert isinstance(d["records"], list)


def test_reregister_same_hash_is_idempotent(live_api):
    r = requests.post(f"{BASE}/digital-trail/register", json={
        "hash": HASH,
        "asset_name": "e2e-test-doc.pdf",
        "asset_type": "document",
    })
    assert r.status_code == 200
    d = r.json()
    assert "already" in d["message"].lower()


def test_verify_unknown_hash(live_api):
    r = requests.post(f"{BASE}/digital-trail/verify", json={"hash": UNKNOWN})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "tampered", f"Expected tampered, got {d['status']}"

