import { describe, it, expect } from "vitest";
import { ILinkClient } from "../../src/core/ilink-client.js";
import { WxBot } from "../../src/bot/bot.js";
import { CDNHandler } from "../../src/media/cdn.js";
import { ConfigManager } from "../../src/cli/config.js";
import { parseMessage, createTextItem } from "../../src/bot/message.js";
import { SessionManager } from "../../src/bot/session.js";

describe("Smoke test — modules import and instantiate", () => {
  it("ILinkClient can be constructed", () => {
    const client = new ILinkClient({
      baseUrl: "https://example.com",
      token: "test",
      uin: "dGVzdA==",
    });
    expect(client).toBeTruthy();
  });

  it("WxBot can be constructed", () => {
    const client = new ILinkClient({
      baseUrl: "https://example.com",
      token: "test",
      uin: "dGVzdA==",
    });
    const cdn = new CDNHandler(client);
    const bot = new WxBot(client, cdn);
    expect(bot).toBeTruthy();
  });

  it("parseMessage works end-to-end", () => {
    const raw = {
      seq: 1,
      message_id: 42,
      from_user_id: "u1",
      to_user_id: "u2",
      create_time_ms: Date.now(),
      session_id: "s1",
      message_type: 1,
      message_state: 0,
      item_list: [{ type: 1, text_item: { text: "smoke test" } }],
      context_token: "ctx",
    };
    const msg = parseMessage(raw as any);
    expect(msg.items[0]).toEqual({ type: "text", text: "smoke test" });
  });

  it("SessionManager tracks sessions", () => {
    const sm = new SessionManager();
    sm.updateFromMessage("u1", "tok", "sess");
    const s = sm.getOrCreate("u1");
    expect(s.contextToken).toBe("tok");
  });
});
