import { sha256 } from "./hash-engine"

export async function generateHash(data: string): Promise<string> {
  return sha256(data)
}