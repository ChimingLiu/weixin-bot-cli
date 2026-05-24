import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigManager } from "../../src/cli/config.js";

const mockStore: Record<string, unknown> = {};
vi.mock("conf", () => {
  return {
    default: class MockConf {
      constructor(options?: { defaults?: Record<string, unknown> }) {
        if (options?.defaults) {
          for (const [key, value] of Object.entries(options.defaults)) {
            if (!(key in mockStore)) {
              mockStore[key] = value;
            }
          }
        }
      }
      get(key: string) { return mockStore[key]; }
      set(key: string, value: unknown) { mockStore[key] = value; }
      delete(key: string) { delete mockStore[key]; }
    },
  };
});

describe("ConfigManager", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockStore)) { delete mockStore[key]; }
  });

  it("saves and retrieves account credentials", () => {
    const config = new ConfigManager();
    config.saveAccount("default", "token-123", "uin-456", "https://example.com");
    const account = config.getAccount("default");
    expect(account?.token).toBe("token-123");
    expect(account?.uin).toBe("uin-456");
    expect(account?.baseUrl).toBe("https://example.com");
  });

  it("returns undefined for unknown account", () => {
    const config = new ConfigManager();
    expect(config.getAccount("nonexistent")).toBeUndefined();
  });

  it("lists all accounts", () => {
    const config = new ConfigManager();
    config.saveAccount("default", "t1", "u1", "https://a.com");
    config.saveAccount("work", "t2", "u2", "https://b.com");
    const names = config.listAccounts();
    expect(names).toContain("default");
    expect(names).toContain("work");
  });

  it("sets and gets default account", () => {
    const config = new ConfigManager();
    config.saveAccount("work", "t", "u", "https://c.com");
    config.setDefaultAccount("work");
    expect(config.getDefaultAccountName()).toBe("work");
  });
});
