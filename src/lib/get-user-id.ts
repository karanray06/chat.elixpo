import type { NextRequest } from "next/server";

/**
 * Extracts the authenticated user ID from the request.
 * In dev mode (DEV_SKIP_AUTH=true), returns the dev user.
 * In production, parses the session cookie set by OAuth.
 */
export function getUserId(req: NextRequest): string | null {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_SKIP_AUTH === "true") {
    return "dev-user-local";
  }

  // The middleware injects x-user-id for dev mode; in production we parse the cookie.
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.split(";").find((c) => c.trim().startsWith("elixpo_session="));
  if (!match) return null;

  try {
    const sessionStr = decodeURIComponent(match.split("=").slice(1).join("="));
    const session = JSON.parse(sessionStr);
    // The session stores tokens; decode the access token's payload for the user id.
    // For now, since the access token is opaque and the middleware validates the session,
    // we use a stable hash of the token as user identifier until a proper user-id claim is added.
    if (session && session.accessToken) {
      return deriveUserId(session.accessToken);
    }
  } catch {
    // invalid session
  }
  return null;
}

/**
 * Derives a stable user identifier from the access token.
 * Attempts JWT payload extraction first (sub claim), falls back to token prefix hash.
 */
function deriveUserId(accessToken: string): string {
  try {
    const parts = accessToken.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.sub) return payload.sub;
      if (payload.userId) return payload.userId;
      if (payload.id) return payload.id;
    }
  } catch {
    // not a JWT or malformed
  }
  // Fallback: use first 32 chars of token as a stable identifier
  return `user_${accessToken.slice(0, 32)}`;
}
