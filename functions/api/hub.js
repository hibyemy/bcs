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

export async function onRequest(context) {
	const request = context.request;

	if (request.headers.get("Upgrade") !== "websocket") {
		return new Response("Expected Upgrade: websocket", { status: 426 });
	}

	// Token validation: read from cookie or Authorization header (fallback)
	const url = new URL(request.url);
	const token = getCookie(request, "bcs_access_token") || url.searchParams.get("token");

	if (!token) {
		return new Response("Missing authorization token", { status: 401 });
	}

	const client = createClient({
		clientID: "bcs-frontend",
		issuer: context.env.AUTH_ISSUER_URL || (url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http://localhost:8789" : "https://openauth-template.bc2005530.workers.dev"),
	});

	console.log("[hub] Token lookup: cookie=" + (getCookie(request, "bcs_access_token") ? "present" : "missing") + ", query=" + (url.searchParams.get("token") ? "present" : "missing"));

	let userId = "";
	try {
		const verified = await client.verify(subjects, token);
		if (verified.err) {
			console.error("[hub] Token verification failed:", verified.err, "Token snippet:", token ? token.substring(0, 15) + "..." : "null");
			return new Response("Invalid or expired token", { status: 401 });
		}
		userId = verified.subject.properties.id;
		console.log("[hub] Token verified successfully for user:", userId);
	} catch (e) {
		console.error("[hub] Token verification exception:", e, "Token snippet:", token ? token.substring(0, 15) + "..." : "null");
		return new Response("Authorization error", { status: 401 });
	}

	if (!context.env.HUB) {
		return new Response("HUB binding is missing", { status: 500 });
	}

	const id = context.env.HUB.idFromName("global-room");
	const stub = context.env.HUB.get(id);

	// Create a new request to pass along the user ID securely
	const proxyRequest = new Request(request, {
		headers: new Headers(request.headers)
	});
	proxyRequest.headers.set("X-User-Id", userId);

	return stub.fetch(proxyRequest);
}
