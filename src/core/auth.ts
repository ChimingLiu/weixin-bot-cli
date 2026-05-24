import { ENDPOINTS, ILINK_APP_ID, ILINK_APP_VERSION } from "./constants.js";

export interface LoginStartResult {
  qrcodeId: string;
  qrImageUrl: string;
}

export interface LoginResult {
  token: string;
  baseUrl: string;
  botId: string;
  userId: string;
}

export interface PollOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export class AuthManager {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      [ENDPOINTS.LOGIN_QR.includes("get_bot_qrcode")
        ? "iLink-App-Id"
        : "iLink-App-Id"]: ILINK_APP_ID,
      "iLink-App-ClientVersion": ILINK_APP_VERSION,
    };
  }

  async startLogin(localTokens: string[] = []): Promise<LoginStartResult> {
    const url = `${this.baseUrl}${ENDPOINTS.LOGIN_QR}?bot_type=3`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ local_token_list: localTokens }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login start failed: ${response.status} — ${text}`);
    }

    const data = (await response.json()) as {
      qrcode?: string;
      qrcode_img_content?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode) {
      throw new Error(`Login error: ${data.errcode} — ${data.errmsg}`);
    }

    if (!data.qrcode) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }

    return {
      qrcodeId: data.qrcode,
      qrImageUrl: data.qrcode_img_content ?? "",
    };
  }

  async pollLoginStatus(
    qrcodeId: string,
    options?: PollOptions
  ): Promise<LoginResult> {
    const timeoutMs = options?.timeoutMs ?? 120_000;
    const pollIntervalMs = options?.pollIntervalMs ?? 2_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const url = `${this.baseUrl}${ENDPOINTS.LOGIN_POLL}?qrcode=${encodeURIComponent(qrcodeId)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Login poll failed: ${response.status} — ${text}`);
      }

      const data = (await response.json()) as {
        status?: string;
        bot_token?: string;
        baseurl?: string;
        ilink_bot_id?: string;
        ilink_user_id?: string;
        redirect_host?: string;
        errcode?: number;
        errmsg?: string;
      };

      if (data.errcode) {
        throw new Error(`Poll error: ${data.errcode} — ${data.errmsg}`);
      }

      const status = data.status ?? "wait";

      if (status === "confirmed" && data.bot_token) {
        return {
          token: data.bot_token,
          baseUrl: data.baseurl ?? this.baseUrl,
          botId: data.ilink_bot_id ?? "",
          userId: data.ilink_user_id ?? "",
        };
      }

      if (status === "expired") {
        throw new Error("QR code expired, please try again");
      }

      if (status === "scaned_but_redirect" && data.redirect_host) {
        this.baseUrl = `https://${data.redirect_host}`;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Login timeout");
  }
}
