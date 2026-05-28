import { DurableObject } from "cloudflare:workers";

export interface Env {
	HUB: DurableObjectNamespace;
}

export class MultiplayerHub extends DurableObject {
	// Map to track the last chat message timestamp per user for rate limiting
	private rateLimitMap = new Map<string, number>();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		// Initialize the SQLite tables and indexes
		this.ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					type TEXT,
					username TEXT,
					content TEXT,
					timestamp INTEGER
				);
			`);
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS users (
					user_id TEXT PRIMARY KEY,
					username TEXT
				);
			`);
			this.ctx.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);`);
		});
	}

	async fetch(request: Request) {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		// Extract the verified user ID from the header
		const userId = request.headers.get("X-User-Id") || "anonymous";

		// Accept the WebSocket connection and tag it with the user ID
		this.ctx.acceptWebSocket(server, [userId]);

		// Fetch the latest 50 messages to send to the newly connected client
		try {
			const cursor = this.ctx.storage.sql.exec(`
				SELECT * FROM messages 
				ORDER BY timestamp DESC 
				LIMIT 50
			`);
			const history = cursor.toArray().reverse();
			
			server.send(JSON.stringify({
				type: 'history',
				data: history
			}));
		} catch (e) {
			console.error("Failed to load history", e);
		}

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		if (typeof message === 'string') {
			try {
				const tags = this.ctx.getTags(ws);
				const userId = tags.length > 0 ? tags[0] : "anonymous";
				const data = JSON.parse(message);
				
				if (data.type === 'set_username') {
					const newUsername = String(data.username).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 15);
					if (newUsername) {
						this.ctx.storage.sql.exec(
							`INSERT INTO users (user_id, username) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET username=excluded.username`,
							userId,
							newUsername
						);
					}
					return;
				}

				if (data.type === 'chat') {
					const now = Date.now();
					
					// Rate Limiting: max 1 message per second
					const lastMsgTime = this.rateLimitMap.get(userId) || 0;
					if (now - lastMsgTime < 1000) {
						// Drop message if sent too quickly
						return; 
					}
					this.rateLimitMap.set(userId, now);

					// Validate content
					let content = String(data.content || "");
					if (content.length > 500) {
						content = content.substring(0, 500); // Truncate overly long messages
					}
					if (!content.trim()) return; // Drop empty messages

					// Lookup secure username from database
					let username = "Guest_" + userId.substring(0, 6);
					const userCursor = this.ctx.storage.sql.exec(`SELECT username FROM users WHERE user_id = ?`, userId);
					const userRows = userCursor.toArray();
					if (userRows.length > 0) {
						username = String(userRows[0].username);
					}

					// Save to SQLite
					this.ctx.storage.sql.exec(
						`INSERT INTO messages (type, username, content, timestamp) VALUES ('chat', ?, ?, ?)`,
						username,
						content,
						now
					);
					// Broadcast with server timestamp and verified username
					this.broadcast(JSON.stringify({
						type: 'chat',
						username: username,
						content: content,
						timestamp: now
					}));
					return;
				}

				// Broadcast to all active websockets (for non-chat presences)
				this.broadcast(message);
			} catch (e) {
				console.error("Error processing message:", e);
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		// When a client disconnects, we can optionally broadcast their departure.
		// For now, the frontend will just timeout their presence.
	}

	broadcast(message: string) {
		for (const ws of this.ctx.getWebSockets()) {
			try {
				ws.send(message);
			} catch (e) {
				// Ignore errors on dead sockets
			}
		}
	}
}

export default {
	async fetch(request: Request, env: Env) {
		// The main worker simply routes all requests to the Durable Object
		const url = new URL(request.url);
		
		if (request.headers.get("Upgrade") === "websocket") {
			// We use a single global room for everyone to start
			const id = env.HUB.idFromName("global-room");
			const stub = env.HUB.get(id);
			return stub.fetch(request);
		}

		return new Response("Expected Upgrade: websocket", { status: 426 });
	},
} satisfies ExportedHandler<Env>;
