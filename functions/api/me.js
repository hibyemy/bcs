import { createClient } from "@openauthjs/openauth/client";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
	user: object({
		id: string(),
	}),
});

function getCookie(request, name) {
  const result = request.headers.get("Cookie")?.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return result ? result[2] : null;
}

export async function onRequestGet(context) {
  const request = context.request;
  const url = new URL(request.url);

  const accessToken = getCookie(request, "bcs_access_token");
  const refreshToken = getCookie(request, "bcs_refresh_token");

  if (!accessToken && !refreshToken) {
    return Response.json({ authenticated: false }, { status: 200 });
  }

  const client = createClient({
    clientID: "bcs-frontend",
    issuer: context.env.AUTH_ISSUER_URL || (url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http://localhost:8789" : "https://openauth-template.bc2005530.workers.dev"),
  });

  try {
    // If we only have a refresh token, we try to refresh it
    let tokenToVerify = accessToken;
    let newTokens = null;

    if (!accessToken && refreshToken) {
      console.log("[me] Access token missing, attempting refresh using refresh token");
      const refreshed = await client.refresh(refreshToken);
      if (refreshed.err) {
        console.error("[me] Token refresh failed:", refreshed.err);
        return clearSessionResponse();
      }
      newTokens = refreshed.tokens;
      tokenToVerify = refreshed.tokens.access;
    }

    // Now verify the token
    const verified = await client.verify(subjects, tokenToVerify, {
      refresh: refreshToken || undefined
    });

    if (verified.err) {
      console.error("[me] Token verification failed:", verified.err);
      return clearSessionResponse();
    }

    // If verified.tokens is present, it means client.verify performed an automatic refresh
    if (verified.tokens) {
      newTokens = verified.tokens;
    }

    const userId = verified.subject.properties.id;
    const headers = new Headers({
      "Content-Type": "application/json"
    });

    if (newTokens) {
      console.log("[me] Tokens refreshed successfully. Setting new cookies.");
      headers.append("Set-Cookie", `bcs_access_token=${newTokens.access}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`);
      if (newTokens.refresh) {
        headers.append("Set-Cookie", `bcs_refresh_token=${newTokens.refresh}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      }
      headers.append("Set-Cookie", `bcs_is_auth=true; Path=/; Secure; SameSite=Lax; Max-Age=3600`);
    }

    return new Response(JSON.stringify({ authenticated: true, user: userId }), {
      status: 200,
      headers
    });

  } catch (e) {
    console.error("[me] Exception in auth check:", e);
    return clearSessionResponse();
  }
}

function clearSessionResponse() {
  const headers = new Headers({
    "Content-Type": "application/json"
  });
  headers.append("Set-Cookie", "bcs_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  headers.append("Set-Cookie", "bcs_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  headers.append("Set-Cookie", "bcs_is_auth=; Path=/; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  
  return new Response(JSON.stringify({ authenticated: false }), {
    status: 200,
    headers
  });
}
