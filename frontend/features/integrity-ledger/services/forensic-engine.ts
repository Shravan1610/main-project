/**
 * Forensic Engine — Encrypt/decrypt forensic metadata (IP, timestamp, document hash).
 *
 * Uses AES-GCM via Web Crypto API. The key is derived from a system constant
 * so only the software can access the forensic data.
 */

const SYSTEM_SALT = "greentrust-forensic-v1"

export interface ForensicData {
  ip: string
  timestamp: number
  documentHash: string
  attemptedHash: string
}

/**
 * Derive a forensic encryption key from the system constant.
 */
async function deriveForensicKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SYSTEM_SALT),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("greentrust-forensic-key"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * Encrypt forensic data into a base64 blob.
 */
export async function encryptForensicData(data: ForensicData): Promise<string> {
  const key = await deriveForensicKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()

  const plaintext = encoder.encode(JSON.stringify(data))

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  )

  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt forensic data from a base64 blob.
 */
export async function decryptForensicData(base64Data: string): Promise<ForensicData> {
  const key = await deriveForensicKey()
  const combined = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  )

  const decoder = new TextDecoder()
  return JSON.parse(decoder.decode(decrypted))
}
