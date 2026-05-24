// Base URL — discovered from reverse-engineering openclaw-weixin
export const ILINK_BASE_URL = "https://ilinkai.weixin.qq.com";

// CDN base URL
export const CDN_BASE_URL = "https://novac2c.cdn.weixin.qq.com/c2c";

export const ENDPOINTS = {
  LOGIN_QR: "/ilink/bot/get_bot_qrcode",
  LOGIN_POLL: "/ilink/bot/get_qrcode_status",
  GET_UPDATES: "/ilink/bot/getupdates",
  SEND_MESSAGE: "/ilink/bot/sendmessage",
  GET_UPLOAD_URL: "/ilink/bot/getuploadurl",
  GET_CONFIG: "/ilink/bot/getconfig",
  SEND_TYPING: "/ilink/bot/sendtyping",
  NOTIFY_START: "/ilink/bot/msg/notifystart",
  NOTIFY_STOP: "/ilink/bot/msg/notifystop",
} as const;

export const DEFAULT_POLL_TIMEOUT = 35_000; // 35 seconds
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 1_000; // 1 second base for exponential backoff

export const AUTH_HEADERS = {
  AUTHORIZATION_TYPE: "AuthorizationType",
  AUTHORIZATION_TYPE_VALUE: "ilink_bot_token",
  UIN: "X-WECHAT-UIN",
  APP_ID: "iLink-App-Id",
  APP_VERSION: "iLink-App-ClientVersion",
} as const;

export const ILINK_APP_ID = "bot";
export const ILINK_APP_VERSION = "353826817"; // uint32 version from reverse-engineering
