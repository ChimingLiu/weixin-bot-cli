import { describe, it, expect, vi, beforeEach } from "vitest";
import { ILinkClient } from "../../src/core/ilink-client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("ILinkClient", () => {
  let client: ILinkClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ILinkClient({
      baseUrl: "https://ilinkai.weixin.qq.com",
      token: "test-token",
      uin: "dGVzdA==",
    });
  });

  it("injects auth headers on every request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [], get_updates_buf: "" }),
    });

    await client.getUpdates();

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer test-token");
    expect(options.headers["AuthorizationType"]).toBe("ilink_bot_token");
    expect(options.headers["X-WECHAT-UIN"]).toBe("dGVzdA==");
    expect(options.headers["iLink-App-Id"]).toBe("bot");
  });

  it("sends POST with JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [], get_updates_buf: "" }),
    });

    await client.getUpdates();

    const [url, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(url).toContain("getupdates");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "unauthorized",
    });

    await expect(client.getUpdates()).rejects.toThrow("401");
  });

  it("retries on network error with exponential backoff", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("network error"))
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [], get_updates_buf: "" }),
      });

    vi.useFakeTimers();
    const promise = client.getUpdates();

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
