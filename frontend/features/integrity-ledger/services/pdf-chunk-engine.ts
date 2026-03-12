/**
 * PDF Chunk Engine — Extract and encrypt a fragment of a PDF for integrity anchoring.
 *
 * Extracts the first N bytes of a file and encrypts them with AES-GCM via Web Crypto API.
 * The encryption key is derived from the document's SHA-256 hash, so only the software
 * (which knows the hash) can decrypt the chunk.
 */

const CHUNK_SIZE = 1024

/**
 * Read the first `bytes` of a File as an ArrayBuffer.
 */
export async function extractPdfChunk(file: File, bytes = CHUNK_SIZE): Promise<ArrayBuffer> {
  const slice = file.slice(0, bytes)
  return slice.arrayBuffer()
}

/**
 * Derive an AES-GCM key from a document hash (deterministic).
 */
async function deriveKey(documentHash: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(documentHash.slice(0, 32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("greentrust-integrity-v1"),
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
 * Encrypt a chunk with AES-GCM. Returns base64 string (iv + ciphertext).
 */
export async function encryptChunk(
  chunk: ArrayBuffer,
  documentHash: string,
): Promise<string> {
  const key = await deriveKey(documentHash)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    chunk,
  )

  // Prepend IV (12 bytes) to ciphertext for later decryption
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a previously encrypted chunk.
 */
export async function decryptChunk(
  base64Data: string,
  documentHash: string,
): Promise<ArrayBuffer> {
  const key = await deriveKey(documentHash)
  const combined = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
}
