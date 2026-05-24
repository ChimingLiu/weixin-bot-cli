// --- Enums ---

export enum MessageType {
  USER = 1,
  BOT = 2,
}

export enum MessageState {
  NEW = 0,
  GENERATING = 1,
  FINISH = 2,
}

export enum MessageItemType {
  TEXT = 1,
  IMAGE = 2,
  VOICE = 3,
  FILE = 4,
  VIDEO = 5,
}

// --- CDN Media ---

export interface CDNMedia {
  encrypt_query_param: string;
  aes_key: string; // Base64-encoded AES-128 key
}

// --- Raw Protocol Types ---

export interface TextItem {
  text: string;
}

export interface FileItem extends CDNMedia {
  file_name: string;
}

export type RawMessageItem =
  | { type: MessageItemType.TEXT; text_item: TextItem }
  | { type: MessageItemType.IMAGE; image_item: CDNMedia }
  | { type: MessageItemType.VOICE; voice_item: CDNMedia }
  | { type: MessageItemType.FILE; file_item: FileItem }
  | { type: MessageItemType.VIDEO; video_item: CDNMedia };

export interface WeixinMessage {
  seq: number;
  message_id: number;
  from_user_id: string;
  to_user_id: string;
  create_time_ms: number;
  session_id: string;
  message_type: MessageType;
  message_state: MessageState;
  item_list: RawMessageItem[];
  context_token: string;
}

// --- API Request/Response ---

export interface BaseInfo {
  channel_version: string;
  bot_agent: string;
}

export interface GetUpdatesRequest {
  get_updates_buf?: string;
  base_info: BaseInfo;
}

export interface GetUpdatesResponse {
  ret?: number;
  errcode?: number;
  errmsg?: string;
  msgs: WeixinMessage[];
  get_updates_buf: string;
  longpolling_timeout_ms?: number;
}

export interface SendMessageRequest {
  msg: {
    from_user_id: string;
    to_user_id: string;
    client_id: string;
    message_type: number;
    message_state: number;
    item_list: RawMessageItem[];
    context_token?: string;
    run_id?: string;
  };
  base_info: BaseInfo;
}

export interface SendMessageResponse {
  message_id?: number;
  errcode?: number;
  errmsg?: string;
}

export interface GetUploadUrlRequest {
  file_type: MessageItemType;
  file_size: number;
  file_md5: string;
}

export interface GetUploadUrlResponse {
  upload_url: string;
  encrypt_query_param: string;
  aes_key: string;
}

export interface GetConfigResponse {
  typing_ticket?: string;
  errcode?: number;
}

// --- Type Guards ---

export function isTextItem(
  item: RawMessageItem
): item is { type: MessageItemType.TEXT; text_item: TextItem } {
  return item.type === MessageItemType.TEXT;
}

export function isImageItem(
  item: RawMessageItem
): item is { type: MessageItemType.IMAGE; image_item: CDNMedia } {
  return item.type === MessageItemType.IMAGE;
}

export function isVoiceItem(
  item: RawMessageItem
): item is { type: MessageItemType.VOICE; voice_item: CDNMedia } {
  return item.type === MessageItemType.VOICE;
}

export function isFileItem(
  item: RawMessageItem
): item is { type: MessageItemType.FILE; file_item: FileItem } {
  return item.type === MessageItemType.FILE;
}

export function isVideoItem(
  item: RawMessageItem
): item is { type: MessageItemType.VIDEO; video_item: CDNMedia } {
  return item.type === MessageItemType.VIDEO;
}
