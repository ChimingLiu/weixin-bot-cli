import { describe, it, expect } from "vitest";
import {
  aesEncrypt,
  aesDecrypt,
  md5,
  generateUin,
} from "../../src/media/crypto.js";

describe("crypto", () => {
  it("encrypts and decrypts with AES-128-ECB", () => {
    const key = Buffer.alloc(16, 0x42); // 16-byte key
    const plaintext = Buffer.from("hello world!");

    const encrypted = aesEncrypt(plaintext, key);
    expect(encrypted).not.toEqual(plaintext);

    const decrypted = aesDecrypt(encrypted, key);
    expect(decrypted).toEqual(plaintext);
  });

  it("produces correct MD5 hash", () => {
    const data = Buffer.from("hello");
    const hash = md5(data);
    expect(hash).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("generates a base64-encoded uint32 uin", () => {
    const uin = generateUin();
    const decoded = Buffer.from(uin, "base64");
    expect(decoded.length).toBe(4); // uint32 = 4 bytes
  });
});
