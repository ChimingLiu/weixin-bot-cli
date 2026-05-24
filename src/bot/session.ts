export interface Session {
  userId: string;
  contextToken?: string;
  sessionId?: string;
  lastActivity: number;
}

export class SessionManager {
  private sessions = new Map<string, Session>();

  getOrCreate(userId: string): Session {
    let session = this.sessions.get(userId);
    if (!session) {
      session = { userId, lastActivity: Date.now() };
      this.sessions.set(userId, session);
    }
    return session;
  }

  updateFromMessage(
    userId: string,
    contextToken: string,
    sessionId: string
  ): void {
    const session = this.getOrCreate(userId);
    session.contextToken = contextToken;
    session.sessionId = sessionId;
    session.lastActivity = Date.now();
  }

  handleTimeout(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.contextToken = undefined;
      session.sessionId = undefined;
    }
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  clear(): void {
    this.sessions.clear();
  }
}
