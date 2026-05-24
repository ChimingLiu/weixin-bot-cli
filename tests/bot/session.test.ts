import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionManager } from "../../src/bot/session.js";

describe("SessionManager", () => {
  let sessions: SessionManager;

  beforeEach(() => {
    sessions = new SessionManager();
  });

  it("creates a new session for unknown user", () => {
    const session = sessions.getOrCreate("user-1");
    expect(session.userId).toBe("user-1");
    expect(session.contextToken).toBeUndefined();
  });

  it("returns existing session for known user", () => {
    const s1 = sessions.getOrCreate("user-1");
    s1.contextToken = "token-abc";
    const s2 = sessions.getOrCreate("user-1");
    expect(s2.contextToken).toBe("token-abc");
    expect(s1).toBe(s2);
  });

  it("updates context token from message", () => {
    sessions.updateFromMessage("user-1", "new-token", "session-1");
    const session = sessions.getOrCreate("user-1");
    expect(session.contextToken).toBe("new-token");
    expect(session.sessionId).toBe("session-1");
  });

  it("handles errcode -14 by clearing session", () => {
    sessions.updateFromMessage("user-1", "token", "sess");
    sessions.handleTimeout("user-1");
    const session = sessions.getOrCreate("user-1");
    expect(session.contextToken).toBeUndefined();
    expect(session.sessionId).toBeUndefined();
  });
});
