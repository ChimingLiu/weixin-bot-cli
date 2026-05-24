import { EventEmitter } from "node:events";
import type { ILinkClient } from "../core/ilink-client.js";
import type { CDNHandler } from "../media/cdn.js";
import { MessageItemType } from "../core/types.js";
import { parseMessage, createTextItem, createMediaItem } from "./message.js";
import { SessionManager } from "./session.js";
import type { WxMessage } from "./message.js";
import type { CDNMedia } from "../core/types.js";

const SESSION_TIMEOUT_ERRCODE = -14;

export class WxBot extends EventEmitter {
  private client: ILinkClient;
  private cdn: CDNHandler;
  private sessions: SessionManager;
  private running = false;

  constructor(client: ILinkClient, cdn: CDNHandler) {
    super();
    this.client = client;
    this.cdn = cdn;
    this.sessions = new SessionManager();
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.emit("login");

    this.pollLoop().catch((err) => {
      this.emit("error", err);
    });
  }

  stop(): void {
    this.running = false;
    this.emit("logout");
  }

  async sendText(userId: string, text: string): Promise<void> {
    const session = this.sessions.getOrCreate(userId);
    const item = createTextItem(text);
    const response = await this.client.sendMessage(
      userId,
      [item],
      session.contextToken,
      session.sessionId
    );
    if (response.errcode === SESSION_TIMEOUT_ERRCODE) {
      this.sessions.handleTimeout(userId);
      throw new Error("Session expired, please retry");
    }
  }

  async sendImage(userId: string, media: CDNMedia): Promise<void> {
    const session = this.sessions.getOrCreate(userId);
    const item = createMediaItem(MessageItemType.IMAGE, media);
    await this.client.sendMessage(userId, [item], session.contextToken, session.sessionId);
  }

  async sendFile(userId: string, media: CDNMedia, fileName: string): Promise<void> {
    const session = this.sessions.getOrCreate(userId);
    const item = createMediaItem(MessageItemType.FILE, media, fileName);
    await this.client.sendMessage(userId, [item], session.contextToken, session.sessionId);
  }

  async sendVideo(userId: string, media: CDNMedia): Promise<void> {
    const session = this.sessions.getOrCreate(userId);
    const item = createMediaItem(MessageItemType.VIDEO, media);
    await this.client.sendMessage(userId, [item], session.contextToken, session.sessionId);
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      try {
        const messages = await this.client.getUpdates();
        for (const raw of messages) {
          const msg = parseMessage(raw);
          this.sessions.updateFromMessage(msg.from, msg.contextToken, msg.sessionId);
          this.emit("message", msg);
        }
      } catch (err) {
        const error = err as Error;
        if (error.message?.includes("-14")) {
          this.emit("error", new Error("Session expired"));
          continue;
        }
        this.emit("error", error);
      }
      // Yield to event loop between iterations. In production, getUpdates()
      // blocks for ~35s via long-poll, so this is only needed for test mocks
      // that resolve instantly.
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
