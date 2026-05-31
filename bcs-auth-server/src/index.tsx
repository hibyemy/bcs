import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";
import * as React from 'react';
import { render } from '@react-email/render';
import { VerificationEmail } from './VerificationEmail';

let authIssuer: ReturnType<typeof issuer>;

// This value should be shared between the OpenAuth server Worker and other
// client Workers that you connect to it, so the types and schema validation are
// consistent.
const subjects = createSubjects({
	user: object({
		id: string(),
	}),
});

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// This top section is just for demo purposes. In a real setup another
		// application would redirect the user to this Worker to be authenticated,
		// and after signing in or registering the user would be redirected back to
		// the application they came from. In our demo setup there is no other
		// application, so this Worker needs to do the initial redirect and handle
		// the callback redirect on completion.
		const url = new URL(request.url);
		if (url.pathname === "/") {
			url.searchParams.set("redirect_uri", url.origin + "/callback");
			url.searchParams.set("client_id", "your-client-id");
			url.searchParams.set("response_type", "code");
			url.pathname = "/authorize";
			return Response.redirect(url.toString());
		} else if (url.pathname === "/callback") {
			return Response.json({
				message: "OAuth flow complete!",
				params: Object.fromEntries(url.searchParams.entries()),
			});
		}

		// The real OpenAuth server code starts here:
		if (!authIssuer) {
			authIssuer = issuer({
			storage: CloudflareStorage({
				namespace: env.AUTH_STORAGE,
			}),
			subjects,
			allow: async (input) => {
				try {
					if (!input || !input.redirectURI) return true;
					if (input.clientID === "bcs-frontend") {
						const allowedOrigins = ["http://localhost", "http://127.0.0.1", "https://bowenchen.xyz"];
						return allowedOrigins.some(origin => input.redirectURI.startsWith(origin));
					}
					return false;
				} catch (e) {
					console.error("Allow hook error", e);
					return false;
				}
			},
			providers: {
				password: PasswordProvider(
					PasswordUI({
						sendCode: async (email, code) => {
							console.log(`Sending code to ${email}`);
							
							const htmlTemplate = await render(<VerificationEmail code={code} />);

							const res = await fetch("https://api.resend.com/emails", {
								method: "POST",
								headers: {
									Authorization: `Bearer ${(env as any).RESEND_API_KEY}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									from: "Auth <auth@bowenchen.xyz>",
									to: email,
									subject: "BCS:// Verification Code",
									html: htmlTemplate,
								}),
							});

							if (!res.ok) {
								console.error("Failed to send email via Resend:", await res.text());
							}
						},
						copy: {
							input_code: "Code (sent to your email)",
						},
					}),
				),
			},
			theme: {
				title: "BCS_SYS:// AUTH",
				primary: "#22c55e",
				background: {
					light: "#000000",
					dark: "#000000",
				},
				css: `
					body {
						font-family: 'Courier New', Courier, monospace;
						color: #22c55e;
					}
					* {
						border-radius: 0 !important;
					}
					h1, h2, h3, h4, h5, h6 {
						color: #4ade80 !important;
						letter-spacing: 0.1em;
						text-transform: uppercase;
					}
					button {
						border: 1px solid #22c55e !important;
						background-color: transparent !important;
						color: #22c55e !important;
						text-transform: uppercase;
						letter-spacing: 0.1em;
						transition: all 0.2s ease;
					}
					button:hover {
						background-color: rgba(34, 197, 94, 0.2) !important;
						box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
					}
					input {
						background-color: rgba(0, 0, 0, 0.8) !important;
						border: 1px solid rgba(34, 197, 94, 0.5) !important;
						color: #4ade80 !important;
						font-family: monospace;
					}
					input:focus {
						border-color: #22c55e !important;
						box-shadow: 0 0 8px rgba(34, 197, 94, 0.5) !important;
						outline: none !important;
					}
					p, span, div, label {
						color: rgba(34, 197, 94, 0.8);
					}
					a {
						color: #22c55e !important;
						text-decoration: none !important;
					}
					a:hover {
						text-decoration: underline !important;
						text-shadow: 0 0 5px rgba(34, 197, 94, 0.8);
					}
				`,
			},
			success: async (ctx, value) => {
				return ctx.subject("user", {
					id: await getOrCreateUser(env, value.email),
				});
			},
			});
		}
		return authIssuer.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;

async function getOrCreateUser(env: Env, email: string): Promise<string> {
	const result = await env.AUTH_DB.prepare(
		`
		INSERT INTO user (email)
		VALUES (?)
		ON CONFLICT (email) DO UPDATE SET email = email
		RETURNING id;
		`,
	)
		.bind(email)
		.first<{ id: string }>();
	if (!result) {
		throw new Error(`Unable to process user: ${email}`);
	}
	console.log(`Found or created user ${result.id} with email ${email}`);
	return result.id;
}
