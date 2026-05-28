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
    issuer: "http://localhost:8789",
  });

  try {
    const tokens = await client.exchange(code, url.origin + "/api/callback");
    
    // Store token in localStorage and redirect back to dashboard
    return new Response(
      `<html>
        <body style="background: black; color: #22c55e; font-family: monospace;">
          <script>
            localStorage.setItem("bcs_access_token", "${tokens.access}");
            window.location.href = "/";
          </script>
          [AUTHENTICATED] Redirecting...
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    return new Response("Authentication failed: " + e.message, { status: 401 });
  }
}
