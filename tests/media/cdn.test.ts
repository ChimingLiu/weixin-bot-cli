import { describe, it, expect, vi, beforeEach } from "vitest";
import { CDNHandler } from "../../src/media/cdn.js";
import { aesEncrypt } from "../../src/media/crypto.js";
import type { ILinkClient } from "../../src/core/ilink-client.js";
import type { CDNMedia } from "../../src/core/types.js";
import { MessageItemType } from "../../src/core/types.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeMockClient(): ILinkClient {
  return {
    getUploadUrl: vi.fn().mockResolvedValue({
      upload_url: "https://novac2c.cdn.weixin.qq.com/c2c/upload/abc",
      encrypt_query_param: "encrypted-param",
      aes_key: Buffer.alloc(16, 0x42).toString("base64"),
    }),
  } as unknown as ILinkClient;
}

describe("CDNHandler", () => {
  let cdn: CDNHandler;
  let client: ILinkClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeMockClient();
    cdn = new CDNHandler(client);
  });

  it("uploads a file and returns CDNMedia", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await cdn.upload(
      Buffer.from("file content"),
      MessageItemType.FILE,
      "test.txt"
    );

    expect(result.encrypt_query_param).toBe("encrypted-param");
    expect(result.aes_key).toBeTruthy();
    expect(client.getUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        file_type: MessageItemType.FILE,
      })
    );
  });

  it("downloads and decrypts a file", async () => {
    const key = Buffer.alloc(16, 0x42);
    const plaintext = Buffer.from("decrypted content");
    const encrypted = aesEncrypt(plaintext, key);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () =>
        encrypted.buffer.slice(
          encrypted.byteOffset,
          encrypted.byteOffset + encrypted.byteLength
        ),
    });

    const media: CDNMedia = {
      encrypt_query_param: "param",
      aes_key: key.toString("base64"),
    };

    const result = await cdn.download(media);
    expect(result).toEqual(plaintext);
  });
});
