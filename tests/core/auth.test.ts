import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthManager } from "../../src/core/auth.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("AuthManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts login and returns QR code ID", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        qrcode: "abc123",
        qrcode_img_content: "https://login.weixin.qq.com/qrcode/abc123",
      }),
    });

    const auth = new AuthManager("https://ilinkai.weixin.qq.com");
    const result = await auth.startLogin();

    expect(result.qrcodeId).toBe("abc123");
    expect(result.qrImageUrl).toBe("https://login.weixin.qq.com/qrcode/abc123");
  });

  it("polls for login status until confirmed", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "wait" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "scaned" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "confirmed",
          bot_token: "user-token-xxx",
          baseurl: "https://ilinkai.weixin.qq.com",
          ilink_bot_id: "bot@im.bot",
          ilink_user_id: "user@im",
        }),
      });

    const auth = new AuthManager("https://ilinkai.weixin.qq.com");
    const result = await auth.pollLoginStatus("abc123");

    expect(result.token).toBe("user-token-xxx");
    expect(result.baseUrl).toBe("https://ilinkai.weixin.qq.com");
    expect(result.botId).toBe("bot@im.bot");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws on login timeout", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "wait" }),
    });

    const auth = new AuthManager("https://ilinkai.weixin.qq.com");
    await expect(
      auth.pollLoginStatus("abc123", { timeoutMs: 100, pollIntervalMs: 10 })
    ).rejects.toThrow("timeout");
  });

  it("throws on QR code expired", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "expired" }),
    });

    const auth = new AuthManager("https://ilinkai.weixin.qq.com");
    await expect(auth.pollLoginStatus("abc123")).rejects.toThrow("expired");
  });
});
