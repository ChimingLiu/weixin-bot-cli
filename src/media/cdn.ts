import { aesEncrypt, aesDecrypt, md5 } from "./crypto.js";
import type { ILinkClient } from "../core/ilink-client.js";
import type { CDNMedia } from "../core/types.js";
import { MessageItemType } from "../core/types.js";
import { CDN_BASE_URL } from "../core/constants.js";

export class CDNHandler {
  constructor(private client: ILinkClient) {}

  async upload(
    data: Buffer,
    fileType: MessageItemType,
    fileName?: string
  ): Promise<CDNMedia> {
    const plaintextMd5 = md5(data);

    const uploadInfo = await this.client.getUploadUrl({
      file_type: fileType,
      file_size: data.length,
      file_md5: plaintextMd5,
    });

    const aesKey = Buffer.from(uploadInfo.aes_key, "base64");
    const encrypted = aesEncrypt(data, aesKey);

    const response = await fetch(uploadInfo.upload_url, {
      method: "PUT",
      body: new Uint8Array(encrypted),
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(`CDN upload failed: ${response.status}`);
    }

    // The CDN returns encrypt_query_param in response header
    const encryptQueryParam =
      response.headers?.get?.("x-encrypted-param") ??
      uploadInfo.encrypt_query_param;

    return {
      encrypt_query_param: encryptQueryParam,
      aes_key: uploadInfo.aes_key,
    };
  }

  async download(media: CDNMedia): Promise<Buffer> {
    const url = `${CDN_BASE_URL}/download?${media.encrypt_query_param}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CDN download failed: ${response.status}`);
    }

    const encrypted = Buffer.from(await response.arrayBuffer());
    const aesKey = Buffer.from(media.aes_key, "base64");
    return aesDecrypt(encrypted, aesKey);
  }
}
