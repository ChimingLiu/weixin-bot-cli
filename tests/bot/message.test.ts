import { describe, it, expect } from "vitest";
import { parseMessage, createTextItem, createMediaItem } from "../../src/bot/message.js";
import { MessageItemType, MessageType, MessageState } from "../../src/core/types.js";
import type { WeixinMessage } from "../../src/core/types.js";

describe("parseMessage", () => {
  it("parses a text message from a user", () => {
    const raw: WeixinMessage = {
      seq: 1,
      message_id: 1001,
      from_user_id: "user-abc",
      to_user_id: "bot-xyz",
      create_time_ms: 1700000000000,
      session_id: "session-1",
      message_type: MessageType.USER,
      message_state: MessageState.FINISH,
      item_list: [
        { type: MessageItemType.TEXT, text_item: { text: "hello world" } },
      ],
      context_token: "ctx-token-123",
    };

    const msg = parseMessage(raw);

    expect(msg.id).toBe("1001");
    expect(msg.from).toBe("user-abc");
    expect(msg.to).toBe("bot-xyz");
    expect(msg.sessionId).toBe("session-1");
    expect(msg.timestamp).toBe(1700000000000);
    expect(msg.contextToken).toBe("ctx-token-123");
    expect(msg.isFromBot).toBe(false);
    expect(msg.items).toHaveLength(1);
    expect(msg.items[0]).toEqual({ type: "text", text: "hello world" });
  });

  it("parses an image message from a bot", () => {
    const raw: WeixinMessage = {
      seq: 2,
      message_id: 1002,
      from_user_id: "bot-xyz",
      to_user_id: "user-abc",
      create_time_ms: 1700000001000,
      session_id: "session-2",
      message_type: MessageType.BOT,
      message_state: MessageState.FINISH,
      item_list: [
        {
          type: MessageItemType.IMAGE,
          image_item: { encrypt_query_param: "enc-123", aes_key: "base64key" },
        },
      ],
      context_token: "ctx-token-456",
    };

    const msg = parseMessage(raw);

    expect(msg.isFromBot).toBe(true);
    expect(msg.items).toHaveLength(1);
    expect(msg.items[0]).toEqual({
      type: "image",
      media: { encrypt_query_param: "enc-123", aes_key: "base64key" },
    });
  });

  it("handles multiple items in one message", () => {
    const raw: WeixinMessage = {
      seq: 3,
      message_id: 1003,
      from_user_id: "user-abc",
      to_user_id: "bot-xyz",
      create_time_ms: 1700000002000,
      session_id: "session-3",
      message_type: MessageType.USER,
      message_state: MessageState.FINISH,
      item_list: [
        { type: MessageItemType.TEXT, text_item: { text: "see this:" } },
        {
          type: MessageItemType.IMAGE,
          image_item: { encrypt_query_param: "enc-456", aes_key: "key2" },
        },
        {
          type: MessageItemType.VOICE,
          voice_item: { encrypt_query_param: "enc-789", aes_key: "key3" },
        },
      ],
      context_token: "ctx-token-789",
    };

    const msg = parseMessage(raw);

    expect(msg.items).toHaveLength(3);
    expect(msg.items[0]).toEqual({ type: "text", text: "see this:" });
    expect(msg.items[1]).toEqual({
      type: "image",
      media: { encrypt_query_param: "enc-456", aes_key: "key2" },
    });
    expect(msg.items[2]).toEqual({
      type: "voice",
      media: { encrypt_query_param: "enc-789", aes_key: "key3" },
    });
  });
});

describe("createTextItem", () => {
  it("creates a text message item", () => {
    const item = createTextItem("hello");
    expect(item).toEqual({
      type: MessageItemType.TEXT,
      text_item: { text: "hello" },
    });
  });
});

describe("createMediaItem", () => {
  it("creates an image item", () => {
    const media = { encrypt_query_param: "eqp", aes_key: "key" };
    const item = createMediaItem(MessageItemType.IMAGE, media);
    expect(item).toEqual({
      type: MessageItemType.IMAGE,
      image_item: media,
    });
  });

  it("creates a file item with fileName", () => {
    const media = { encrypt_query_param: "eqp", aes_key: "key" };
    const item = createMediaItem(MessageItemType.FILE, media, "report.pdf");
    expect(item).toEqual({
      type: MessageItemType.FILE,
      file_item: { ...media, file_name: "report.pdf" },
    });
  });
});
