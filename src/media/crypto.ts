import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-128-ecb";

export function aesEncrypt(data: Buffer, key: Buffer): Buffer {
  const cipher = createCipheriv(ALGORITHM, key, null);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

export function aesDecrypt(data: Buffer, key: Buffer): Buffer {
  const decipher = createDecipheriv(ALGORITHM, key, null);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export function md5(data: Buffer): string {
  return createHash("md5").update(data).digest("hex");
}

export function generateUin(): string {
  const buf = randomBytes(4);
  return buf.toString("base64");
}
