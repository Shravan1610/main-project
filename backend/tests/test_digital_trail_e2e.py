"""End-to-end tests for the Digital Trail feature."""
import requests

BASE = "http://localhost:8000"
HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TAMPERED = "0000000000000000000000000000000000000000000000000000000000000000"

passed = 0
failed = 0


def check(name, condition, msg=""):
    global passed, failed
    if condition:
        print(f"  PASS: {name}")
        passed += 1
    else:
        print(f"  FAIL: {name} — {msg}")
        failed += 1


print("=== E2E TEST: Digital Trail ===\n")

# 1. Register
print("Test 1: Register document")
r = requests.post(f"{BASE}/digital-trail/register", json={
    "hash": HASH,
    "asset_name": "e2e-test-doc.pdf",
    "asset_type": "document",
    "encrypted_chunk": "dGVzdCBjaHVuaw==",
})
d = r.json()
check("HTTP 200", r.status_code == 200, f"got {r.status_code}")
check("status anchored", d["record"]["status"] == "anchored")
check("has blockchain_tx", d["record"]["blockchain_tx"].startswith("0x"))
check("message", "registered" in d["message"].lower())

# 2. Verify matching hash
print("\nTest 2: Verify matching hash")
r = requests.post(f"{BASE}/digital-trail/verify", json={"hash": HASH})
d = r.json()
check("status verified", d["status"] == "verified", f"got {d['status']}")
check("no forensic event", d["forensic_event"] is None)
check("last_verified_at updated", d["record"]["last_verified_at"] is not None)

# 3. Verify tampered hash
print("\nTest 3: Verify tampered hash")
r = requests.post(f"{BASE}/digital-trail/verify", json={
    "hash": TAMPERED,
    "original_hash": HASH,
})
d = r.json()
check("status tampered", d["status"] == "tampered", f"got {d['status']}")
check("forensic event exists", d["forensic_event"] is not None)
check("IP captured", bool(d["forensic_event"]["ip"]))
check("timestamp captured", bool(d["forensic_event"]["timestamp"]))
check("attempted hash stored", d["forensic_event"]["attempted_hash"] == TAMPERED)
check("original hash stored", d["forensic_event"]["original_hash"] == HASH)

# 4. Forensic trail
print("\nTest 4: Get forensic trail")
r = requests.get(f"{BASE}/digital-trail/forensic/{HASH}")
d = r.json()
check("has events", len(d["events"]) >= 1)
check("tamper count", d["total_tamper_attempts"] >= 1)
check("asset name", d["asset_name"] == "e2e-test-doc.pdf")

# 5. Get single record
print("\nTest 5: Get single record")
r = requests.get(f"{BASE}/digital-trail/records/{HASH}")
d = r.json()
check("record exists", "record" in d)
check("correct asset", d["record"]["asset_name"] == "e2e-test-doc.pdf")

# 6. List all records
print("\nTest 6: List all records")
r = requests.get(f"{BASE}/digital-trail/records")
d = r.json()
check("total >= 1", d["total"] >= 1)
check("records is list", isinstance(d["records"], list))

# 7. Re-register same hash (should update, not duplicate)
print("\nTest 7: Re-register same hash (idempotent)")
r = requests.post(f"{BASE}/digital-trail/register", json={
    "hash": HASH,
    "asset_name": "e2e-test-doc.pdf",
    "asset_type": "document",
})
d = r.json()
check("already registered msg", "already" in d["message"].lower())

# 8. Verify unknown hash (no original_hash)
print("\nTest 8: Verify unknown hash (no original)")
r = requests.post(f"{BASE}/digital-trail/verify", json={
    "hash": "1111111111111111111111111111111111111111111111111111111111111111",
})
d = r.json()
check("status tampered", d["status"] == "tampered", f"got {d['status']}")

# Summary
print(f"\n{'='*40}")
print(f"RESULTS: {passed} passed, {failed} failed")
if failed == 0:
    print("ALL TESTS PASSED")
else:
    print("SOME TESTS FAILED")
    exit(1)
