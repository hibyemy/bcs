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

		// Connect a second client to check if history contains the message
		const request2 = new Request("http://example.com/", {
			headers: {
				Upgrade: "websocket",
				Connection: "Upgrade",
				"X-User-Id": "test-user-456"
			}
		});
		const response2 = await SELF.fetch(request2);
		expect(response2.status).toBe(101);
		const ws2 = response2.webSocket;
		expect(ws2).toBeDefined();
		ws2!.accept();

		const historyPromise2 = new Promise<any>((resolve) => {
			ws2!.addEventListener("message", (event) => {
				const data = JSON.parse(event.data as string);
				if (data.type === "history") {
					resolve(data);
				}
			});
		});

		const history2 = await historyPromise2;
		expect(history2.type).toBe("history");
		expect(history2.data.length).toBeGreaterThanOrEqual(1);
		
		// Find the message we sent
		const savedMsg = history2.data.find((m: any) => m.content === "Hello from test!");
		expect(savedMsg).toBeDefined();
		expect(savedMsg.username).toBe("Guest_test-u");
		expect(savedMsg.type).toBe("chat");
	});
});
