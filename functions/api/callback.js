import { createClient } from "@openauthjs/openauth/client";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
	user: object({
		id: string(),
	}),
});

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  const client = createClient({
    clientID: "bcs-frontend",
    // We will use an environment variable for issuer, or fallback to prod
    issuer: context.env.AUTH_ISSUER_URL || (url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http://localhost:8789" : "https://auth.bowenchen.xyz"),
  });

  try {
    const exchanged = await client.exchange(code, url.origin + "/api/callback");
    console.log("[callback] Exchanged response:", JSON.stringify(exchanged));
    
    if (exchanged.err) {
      console.error("[callback] Exchange error:", exchanged.err);
      return new Response("Authentication failed: " + exchanged.err.message, { status: 401 });
    }
    
    const tokens = exchanged.tokens;
    if (!tokens || !tokens.access) {
      console.error("[callback] Exchange success but tokens or access is missing. exchanged:", JSON.stringify(exchanged));
      return new Response("Authentication failed: Tokens or access token is missing in exchange response", { status: 401 });
    }
    
    const { access, refresh } = tokens;
    console.log("[callback] Successfully obtained access token starting with:", access.substring(0, 10));
    
    // Create headers for multiple cookies
    const headers = new Headers();
    headers.append("Location", "/");
    // Secure HttpOnly cookie for the actual token
    headers.append("Set-Cookie", `bcs_access_token=${access}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`);
    if (refresh) {
      headers.append("Set-Cookie", `bcs_refresh_token=${refresh}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    }
    // Non-HttpOnly cookie just so frontend knows auth state
    headers.append("Set-Cookie", `bcs_is_auth=true; Path=/; Secure; SameSite=Lax; Max-Age=3600`);

    return new Response(null, {
      status: 302,
      headers: headers
    });
  } catch (e) {
    console.error("[callback] Exchange exception:", e);
    return new Response("Authentication failed: " + e.message, { status: 401 });
  }
}
