import { describe, it, expect, vi, beforeEach } from "vitest";
import { WxBot } from "../../src/bot/bot.js";
import type { ILinkClient } from "../../src/core/ilink-client.js";
import type { CDNHandler } from "../../src/media/cdn.js";
import { MessageItemType, MessageType, MessageState } from "../../src/core/types.js";
import type { WeixinMessage } from "../../src/core/types.js";

function makeMockClient(messages: WeixinMessage[] = []): ILinkClient {
  let callCount = 0;
  return {
    getUpdates: vi.fn().mockImplementation(() => {
      if (callCount < messages.length) {
        return Promise.resolve([messages[callCount++]]);
      }
      return Promise.resolve([]);
    }),
    sendMessage: vi.fn().mockResolvedValue({}),
    sendTyping: vi.fn().mockResolvedValue({}),
    setToken: vi.fn(),
    setSyncBuf: vi.fn(),
  } as unknown as ILinkClient;
}

function makeMockCDN(): CDNHandler {
  return {
    upload: vi.fn().mockResolvedValue({
      encrypt_query_param: "eqp",
      aes_key: "key",
    }),
    download: vi.fn().mockResolvedValue(Buffer.from("file")),
  } as unknown as CDNHandler;
}

function makeTextMessage(text: string): WeixinMessage {
  return {
    seq: 1,
    message_id: 100,
    from_user_id: "user-abc",
    to_user_id: "bot-id",
    create_time_ms: Date.now(),
    session_id: "session-1",
    message_type: MessageType.USER,
    message_state: MessageState.NEW,
    item_list: [{ type: MessageItemType.TEXT, text_item: { text } }],
    context_token: "ctx-123",
  };
}

describe("WxBot", () => {
  it("emits message event for incoming text", async () => {
    const client = makeMockClient([makeTextMessage("hello")]);
    const cdn = makeMockCDN();
    const bot = new WxBot(client, cdn);

    const messages: string[] = [];
    bot.on("message", (msg) => {
      messages.push(msg.items[0].type === "text" ? msg.items[0].text : "");
    });

    await bot.start();
    await new Promise((r) => setTimeout(r, 50));

    expect(messages).toContain("hello");
    bot.stop();
  });

  it("sendText calls client.sendMessage with text item", async () => {
    const client = makeMockClient();
    const cdn = makeMockCDN();
    const bot = new WxBot(client, cdn);

    await bot.sendText("user-123", "hi there");

    expect(client.sendMessage).toHaveBeenCalledWith(
      "user-123",
      [expect.objectContaining({ type: MessageItemType.TEXT })],
      undefined,
      undefined
    );
  });

  it("stops polling when stop() is called", async () => {
    const client = makeMockClient([makeTextMessage("msg1")]);
    const cdn = makeMockCDN();
    const bot = new WxBot(client, cdn);

    bot.start();
    bot.stop();

    await new Promise((r) => setTimeout(r, 100));
    expect(
      (client.getUpdates as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBeLessThanOrEqual(1);
  });
});
