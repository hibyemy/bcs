import { createClient } from "@openauthjs/openauth/client";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
	user: object({
		id: string(),
	}),
});

export async function onRequest(context) {
	const request = context.request;

	if (request.headers.get("Upgrade") !== "websocket") {
		return new Response("Expected Upgrade: websocket", { status: 426 });
	}

	// Token validation: if a token is provided, verify it.
	// If no token is provided, allow the connection (for development / unauthenticated access).
	// To enforce auth in production, change the `if (token)` check to require it.
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return new Response("Missing authorization token", { status: 401 });
	}

	const client = createClient({
		clientID: "bcs-frontend",
		issuer: "http://localhost:8789",
	});

	let userId = "";
	try {
		const verified = await client.verify(subjects, token);
		if (verified.err) {
			return new Response("Invalid or expired token", { status: 401 });
		}
		userId = verified.subject.properties.id;
	} catch (e) {
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
