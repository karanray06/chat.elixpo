/**
 * Validates that a URL is safe to fetch server-side (blocks SSRF vectors).
 * Rejects private/internal IPs, non-http(s) schemes, and metadata endpoints.
 */
export function isSafeUrl(input: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0"
  ) {
    return false;
  }

  // Block cloud metadata endpoints
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") {
    return false;
  }

  // Block private IP ranges (10.x, 172.16-31.x, 192.168.x)
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 169 && b === 254) return false;
  }

  return true;
}
