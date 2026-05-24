import { describe, it, expect } from "vitest";
import {
  MessageType,
  MessageState,
  MessageItemType,
  isTextItem,
  isImageItem,
  isVoiceItem,
  isFileItem,
  isVideoItem,
} from "../../src/core/types.js";

describe("MessageItemType guards", () => {
  it("isTextItem identifies text items", () => {
    const item = { type: MessageItemType.TEXT, text_item: { text: "hello" } };
    expect(isTextItem(item)).toBe(true);
    expect(isImageItem(item)).toBe(false);
  });

  it("isImageItem identifies image items", () => {
    const item = {
      type: MessageItemType.IMAGE,
      image_item: { encrypt_query_param: "x", aes_key: "y" },
    };
    expect(isImageItem(item)).toBe(true);
    expect(isTextItem(item)).toBe(false);
  });

  it("isVoiceItem identifies voice items", () => {
    const item = {
      type: MessageItemType.VOICE,
      voice_item: { encrypt_query_param: "x", aes_key: "y" },
    };
    expect(isVoiceItem(item)).toBe(true);
  });

  it("isFileItem identifies file items", () => {
    const item = {
      type: MessageItemType.FILE,
      file_item: {
        file_name: "doc.pdf",
        encrypt_query_param: "x",
        aes_key: "y",
      },
    };
    expect(isFileItem(item)).toBe(true);
  });

  it("isVideoItem identifies video items", () => {
    const item = {
      type: MessageItemType.VIDEO,
      video_item: { encrypt_query_param: "x", aes_key: "y" },
    };
    expect(isVideoItem(item)).toBe(true);
  });
});
