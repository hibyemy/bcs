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
});
