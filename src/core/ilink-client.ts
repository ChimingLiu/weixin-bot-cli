import {
  ILINK_BASE_URL,
  ENDPOINTS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY,
  AUTH_HEADERS,
  ILINK_APP_ID,
  ILINK_APP_VERSION,
  DEFAULT_POLL_TIMEOUT,
} from "./constants.js";
import type {
  GetUpdatesRequest,
  GetUpdatesResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  GetConfigResponse,
  WeixinMessage,
  RawMessageItem,
  BaseInfo,
} from "./types.js";
import { randomBytes } from "node:crypto";

export interface ILinkClientOptions {
  baseUrl?: string;
  token: string;
  uin: string;
  maxRetries?: number;
  retryDelay?: number;
}

export class ILinkClient {
  private baseUrl: string;
  private token: string;
  private uin: string;
  private maxRetries: number;
  private retryDelay: number;
  private syncBuf = "";

  constructor(options: ILinkClientOptions) {
    this.baseUrl = options.baseUrl ?? ILINK_BASE_URL;
    this.token = options.token;
    this.uin = options.uin;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
  }

  // --- Setters ---

  setToken(token: string): void {
    this.token = token;
  }

  setSyncBuf(buf: string): void {
    this.syncBuf = buf;
  }

  // --- Core request method ---

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      [AUTH_HEADERS.AUTHORIZATION_TYPE]: AUTH_HEADERS.AUTHORIZATION_TYPE_VALUE,
      [AUTH_HEADERS.UIN]: this.uin,
      [AUTH_HEADERS.APP_ID]: ILINK_APP_ID,
      [AUTH_HEADERS.APP_VERSION]: ILINK_APP_VERSION,
    };
  }

  private getBaseInfo(): BaseInfo {
    return {
      channel_version: "2.4.4",
      bot_agent: "wx-bot-cli",
    };
  }

  private generateClientId(): string {
    const ts = Date.now();
    const hex = randomBytes(4).toString("hex");
    return `wx-bot-cli:${ts}-${hex}`;
  }

  private async request<T>(
    path: string,
    body: unknown,
    retries?: number
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders();
    const init: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };
    const maxRetries = retries ?? this.maxRetries;

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, init);
      } catch (error) {
        // Network-level error from fetch — retry with backoff
        lastError = error;
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }

      // Got a response — HTTP errors are not retried
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `HTTP ${response.status} ${response.statusText}: ${text}`
        );
      }
      return (await response.json()) as T;
    }
    throw lastError;
  }

  // --- API methods ---

  async getUpdates(): Promise<WeixinMessage[]> {
    const body: GetUpdatesRequest = {
      get_updates_buf: this.syncBuf,
      base_info: this.getBaseInfo(),
    };
    const response = await this.request<GetUpdatesResponse>(
      ENDPOINTS.GET_UPDATES,
      body
    );
    this.syncBuf = response.get_updates_buf;
    return response.msgs ?? [];
  }

  async sendMessage(
    toUserId: string,
    items: RawMessageItem[],
    contextToken?: string,
    sessionId?: string
  ): Promise<SendMessageResponse> {
    const body: SendMessageRequest = {
      msg: {
        from_user_id: "",
        to_user_id: toUserId,
        client_id: this.generateClientId(),
        message_type: 2, // BOT
        message_state: 2, // FINISH
        item_list: items,
        ...(contextToken !== undefined && { context_token: contextToken }),
        run_id: sessionId,
      },
      base_info: this.getBaseInfo(),
    };
    return this.request<SendMessageResponse>(ENDPOINTS.SEND_MESSAGE, body, 0);
  }

  async getUploadUrl(
    params: GetUploadUrlRequest
  ): Promise<GetUploadUrlResponse> {
    return this.request<GetUploadUrlResponse>(ENDPOINTS.GET_UPLOAD_URL, params);
  }

  async getConfig(): Promise<GetConfigResponse> {
    return this.request<GetConfigResponse>(ENDPOINTS.GET_CONFIG, {});
  }

  async sendTyping(toUserId: string): Promise<void> {
    await this.request<unknown>(ENDPOINTS.SEND_TYPING, {
      to_user_id: toUserId,
    });
  }
}
