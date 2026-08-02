import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAuthorizationUrl,
  setSessionCookie,
  parseSessionCookie,
  clearSessionCookie,
  getRedirectUri,
} from "./auth";

describe("getRedirectUri", () => {
  it("builds the callback URL from the request origin", () => {
    const req = new Request("https://chat.elixpo.com/api/auth/login");
    const uri = getRedirectUri(req);
    expect(uri).toBe("https://chat.elixpo.com/api/auth/callback");
  });

  it("works with localhost", () => {
    const req = new Request("http://localhost:3000/any");
    const uri = getRedirectUri(req);
    expect(uri).toBe("http://localhost:3000/api/auth/callback");
  });
});

describe("getAuthorizationUrl", () => {
  it("contains required OAuth params", () => {
    const url = getAuthorizationUrl("https://example.com/callback", "state123");
    expect(url).toContain("response_type=code");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("state=state123");
    expect(url).toContain("scope=openid+profile+email");
  });

  it("uses the accounts base URL", () => {
    const url = getAuthorizationUrl("https://example.com/callback", "s");
    expect(url).toContain("/oauth/authorize");
  });
});

describe("setSessionCookie", () => {
  it("produces a cookie string with encoded JSON", () => {
    const cookie = setSessionCookie("access-tok", "refresh-tok");
    expect(cookie).toContain("elixpo_session=");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=");

    // Decode the cookie value
    const match = cookie.match(/elixpo_session=([^;]+)/);
    expect(match).toBeTruthy();
    const decoded = JSON.parse(decodeURIComponent(match![1]));
    expect(decoded.accessToken).toBe("access-tok");
    expect(decoded.refreshToken).toBe("refresh-tok");
  });

  it("sets a 15-day max age", () => {
    const cookie = setSessionCookie("a", "r");
    const fifteenDays = 15 * 24 * 60 * 60;
    expect(cookie).toContain(`Max-Age=${fifteenDays}`);
  });
});

describe("parseSessionCookie", () => {
  it("returns null for null header", () => {
    expect(parseSessionCookie(null)).toBeNull();
  });

  it("returns null when cookie is missing", () => {
    expect(parseSessionCookie("other_cookie=value")).toBeNull();
  });

  it("parses a valid session cookie", () => {
    const value = encodeURIComponent(
      JSON.stringify({ accessToken: "at", refreshToken: "rt" })
    );
    const header = `other=x; elixpo_session=${value}; another=y`;
    const result = parseSessionCookie(header);
    expect(result).toEqual({ accessToken: "at", refreshToken: "rt" });
  });

  it("returns null for malformed JSON", () => {
    const header = "elixpo_session=not-json";
    expect(parseSessionCookie(header)).toBeNull();
  });

  it("handles cookie value with = signs", () => {
    const value = encodeURIComponent(
      JSON.stringify({ accessToken: "a=b=c", refreshToken: "d=e" })
    );
    const header = `elixpo_session=${value}`;
    const result = parseSessionCookie(header);
    expect(result).toEqual({ accessToken: "a=b=c", refreshToken: "d=e" });
  });
});

describe("clearSessionCookie", () => {
  it("produces a cookie with Max-Age=0", () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain("elixpo_session=");
    expect(cookie).toContain("Max-Age=0");
  });
});
