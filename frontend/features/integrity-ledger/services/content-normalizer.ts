export function normalizeContent(input: unknown): string {

  if (typeof input === "string") {
    return input.trim().replace(/\s+/g, " ")
  }

  if (typeof input === "object") {
    return JSON.stringify(input)
  }

  return String(input)
}