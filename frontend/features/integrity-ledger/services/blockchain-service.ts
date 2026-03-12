export async function recordHashOnBlockchain(hash: string): Promise<string> {
  // Simulate blockchain network latency
  await new Promise<void>(resolve => setTimeout(resolve, 400))

  // Generate a deterministic-looking TX hash via Web Crypto
  const encoder = new TextEncoder()
  const salt = `${hash}:${Date.now()}:anchored`
  const data = encoder.encode(salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}