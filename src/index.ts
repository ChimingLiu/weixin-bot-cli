export { ILinkClient } from "./core/ilink-client.js";
export { AuthManager } from "./core/auth.js";
export { WxBot } from "./bot/bot.js";
export { CDNHandler } from "./media/cdn.js";
export { SessionManager } from "./bot/session.js";
export { ConfigManager } from "./cli/config.js";

export type { WxMessage, ParsedMessageItem } from "./bot/message.js";
export type { CDNMedia, WeixinMessage, RawMessageItem } from "./core/types.js";
export { MessageItemType, MessageType, MessageState } from "./core/types.js";
