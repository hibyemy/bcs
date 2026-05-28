import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src";

describe("MultiplayerHub worker", () => {
	it("returns 426 when no websocket upgrade is provided", async () => {
		const request = new Request<unknown, IncomingRequestCfProperties>(
			"http://example.com/"
		);
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(426);
		expect(await response.text()).toMatchInlineSnapshot(`"Expected Upgrade: websocket"`);
	});

	it("responds with 426 (integration style)", async () => {
		const request = new Request("http://example.com/");
		const response = await SELF.fetch(request);
		expect(response.status).toBe(426);
		expect(await response.text()).toMatchInlineSnapshot(`"Expected Upgrade: websocket"`);
	});

	it("supports websocket connection and sending messages", async () => {
		const request = new Request("http://example.com/", {
			headers: {
				Upgrade: "websocket",
				Connection: "Upgrade",
				"X-User-Id": "test-user-123"
			}
		});
		const response = await SELF.fetch(request);
		expect(response.status).toBe(101);
		const ws = response.webSocket;
		expect(ws).toBeDefined();
		ws!.accept();

		// Wait for the history message
		const historyPromise = new Promise<any>((resolve) => {
			ws!.addEventListener("message", (event) => {
				const data = JSON.parse(event.data as string);
				if (data.type === "history") {
					resolve(data);
				}
			});
		});

		const history = await historyPromise;
		expect(history.type).toBe("history");
		expect(history.data).toBeInstanceOf(Array);

		// Send a chat message
		ws!.send(JSON.stringify({
			type: "chat",
			username: "TestAgent",
			content: "Hello from test!"
		}));

		// Wait for the broadcasted message
		const messagePromise = new Promise<any>((resolve) => {
			ws!.addEventListener("message", (event) => {
				const data = JSON.parse(event.data as string);
				if (data.type === "chat") {
					resolve(data);
				}
			});
		});

		const chat = await messagePromise;
		expect(chat.type).toBe("chat");
		expect(chat.content).toBe("Hello from test!");
		expect(chat.username).toBe("Guest_test-u"); // Since username hasn't been set in DB yet, defaults to Guest_ + prefix of userId
	});
});
