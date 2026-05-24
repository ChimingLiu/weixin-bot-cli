import {
  MessageItemType,
  MessageType,
  isTextItem,
  isImageItem,
  isVoiceItem,
  isFileItem,
  isVideoItem,
} from "../core/types.js";
import type { WeixinMessage, RawMessageItem, CDNMedia } from "../core/types.js";

// --- App-level types ---

export interface WxMessage {
  id: string;
  from: string;
  to: string;
  sessionId: string;
  timestamp: number;
  contextToken: string;
  items: ParsedMessageItem[];
  isFromBot: boolean;
}

export type ParsedMessageItem =
  | { type: "text"; text: string }
  | { type: "image"; media: CDNMedia }
  | { type: "voice"; media: CDNMedia }
  | { type: "file"; media: CDNMedia; fileName: string }
  | { type: "video"; media: CDNMedia };

// --- Parser ---

function parseItem(item: RawMessageItem): ParsedMessageItem {
  if (isTextItem(item)) {
    return { type: "text", text: item.text_item.text };
  }
  if (isImageItem(item)) {
    return { type: "image", media: item.image_item };
  }
  if (isVoiceItem(item)) {
    return { type: "voice", media: item.voice_item };
  }
  if (isFileItem(item)) {
    return { type: "file", media: item.file_item, fileName: item.file_item.file_name };
  }
  if (isVideoItem(item)) {
    return { type: "video", media: item.video_item };
  }
  // Exhaustive guard
  const _exhaustive: never = item;
  throw new Error(`Unknown item type: ${JSON.stringify(_exhaustive)}`);
}

export function parseMessage(raw: WeixinMessage): WxMessage {
  return {
    id: String(raw.message_id),
    from: raw.from_user_id,
    to: raw.to_user_id,
    sessionId: raw.session_id,
    timestamp: raw.create_time_ms,
    contextToken: raw.context_token,
    isFromBot: raw.message_type === MessageType.BOT,
    items: raw.item_list.map(parseItem),
  };
}

// --- Item builders ---

export function createTextItem(text: string): RawMessageItem {
  return {
    type: MessageItemType.TEXT,
    text_item: { text },
  };
}

export function createMediaItem(
  type: MessageItemType.IMAGE | MessageItemType.VIDEO | MessageItemType.VOICE,
  media: CDNMedia,
): RawMessageItem;
export function createMediaItem(
  type: MessageItemType.FILE,
  media: CDNMedia,
  fileName: string,
): RawMessageItem;
export function createMediaItem(
  type: MessageItemType,
  media: CDNMedia,
  fileName?: string,
): RawMessageItem {
  switch (type) {
    case MessageItemType.IMAGE:
      return { type: MessageItemType.IMAGE, image_item: media };
    case MessageItemType.VOICE:
      return { type: MessageItemType.VOICE, voice_item: media };
    case MessageItemType.VIDEO:
      return { type: MessageItemType.VIDEO, video_item: media };
    case MessageItemType.FILE:
      if (!fileName) throw new Error("fileName is required for FILE type");
      return {
        type: MessageItemType.FILE,
        file_item: { ...media, file_name: fileName },
      };
    default:
      throw new Error(`Unsupported media type: ${type}`);
  }
}
