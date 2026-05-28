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
    issuer: context.env.AUTH_ISSUER_URL || (url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http://localhost:8789" : "https://openauth-template.bc2005530.workers.dev"),
  });

  try {
    const exchanged = await client.exchange(code, url.origin + "/api/callback");
    if (exchanged.err) {
      return new Response("Authentication failed: " + exchanged.err.message, { status: 401 });
    }
    
    const { access } = exchanged.tokens;
    
    // Create headers for multiple cookies
    const headers = new Headers();
    headers.append("Location", "/");
    // Secure HttpOnly cookie for the actual token
    headers.append("Set-Cookie", `bcs_access_token=${access}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`);
    // Non-HttpOnly cookie just so frontend knows auth state
    headers.append("Set-Cookie", `bcs_is_auth=true; Path=/; Secure; SameSite=Lax; Max-Age=3600`);

    return new Response(null, {
      status: 302,
      headers: headers
    });
  } catch (e) {
    return new Response("Authentication failed: " + e.message, { status: 401 });
  }
}
