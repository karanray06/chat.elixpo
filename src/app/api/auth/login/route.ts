import { NextResponse } from "next/server";
import { getAuthorizationUrl, getRedirectUri } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const redirectUri = getRedirectUri(request);
    const state = crypto.randomUUID();

    const authUrl = getAuthorizationUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.headers.append("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    return response;
  } catch (error) {
    console.error("Login redirect error:", error);
    return NextResponse.redirect(new URL("/?error=login_failed", request.url));
  }
}
