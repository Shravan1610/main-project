export async function recordHashOnBlockchain(hash: string): Promise<string> {
  // Simulate blockchain network latency in non-production environments
  if (process.env.NODE_ENV !== "production") {
    await new Promise<void>(resolve => setTimeout(resolve, 400))
  }

  // Generate a non-deterministic, TX-like hash via Web Crypto (includes timestamp in salt)
  const encoder = new TextEncoder()
  const salt = `${hash}:${Date.now()}:anchored`
  const data = encoder.encode(salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}