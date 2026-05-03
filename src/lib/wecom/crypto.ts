/**
 * WeCom Plugin - Crypto Utilities
 * 企业微信消息加解密和签名验证
 */

import crypto from 'crypto';

const AES_KEY_LENGTH = 32;
const AES_IV_LENGTH = 16;

/**
 * 从 EncodingAESKey 生成 AES Key
 * WeCom 的 AES Key 是 43 位 base64 字符串，解码后为 32 字节
 */
function getAESKey(encodingAESKey: string): Buffer {
  return Buffer.from(encodingAESKey + '=', 'base64');
}

/**
 * 验证企业微信回调签名
 * @param token 回调 Token
 * @param signature 签名（msg_signature 参数）
 * @param timestamp 时间戳
 * @param nonce 随机字符串
 * @param encrypt 加密内容
 */
export function verifySignature(
  token: string,
  signature: string,
  timestamp: string,
  nonce: string,
  encrypt: string
): boolean {
  const arr = [token, timestamp, nonce, encrypt].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1').update(str).digest('hex');
  return sha1 === signature;
}

/**
 * 解密企业微信消息
 * @param encodingAESKey EncodingAESKey
 * @param encrypt 加密字符串
 */
export function decryptMessage(encodingAESKey: string, encrypt: string): string {
  const AESKey = getAESKey(encodingAESKey);

  // 解码加密字符串
  const encryptedBuffer = Buffer.from(encrypt + '=', 'base64');

  // 使用 AES-256-CBC 解密
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    AESKey,
    AESKey.slice(0, AES_IV_LENGTH)
  );

  // PKCS7 padding
  decipher.setAutoPadding(false);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);

  // 移除随机 16 字节 IV
  const content = decrypted.slice(AES_IV_LENGTH);

  // 解析内容：[4字节消息长度][内容][随机尾部]
  const msgLen = content.readUInt32BE(0);
  const message = content.slice(4, 4 + msgLen).toString('utf8');

  return message;
}

/**
 * 加密消息（用于回调 URL 验证时解密 echostr）
 * @param encodingAESKey EncodingAESKey
 * @param content 要加密的内容
 */
export function encryptMessage(encodingAESKey: string, content: string): string {
  const AESKey = getAESKey(encodingAESKey);

  // 生成随机 16 字节 IV
  const iv = crypto.randomBytes(AES_IV_LENGTH);

  // 构造消息体：[4字节内容长度][内容][随机尾部]
  const msgLenBuffer = Buffer.alloc(4);
  msgLenBuffer.writeUInt32BE(content.length, 0);
  const randomTail = crypto.randomBytes(16);

  const plaintext = Buffer.concat([
    msgLenBuffer,
    Buffer.from(content, 'utf8'),
    randomTail
  ]);

  // PKCS7 padding
  const blockSize = 32;
  const padding = blockSize - (plaintext.length % blockSize);
  const paddingBuffer = Buffer.alloc(padding, padding);
  const paddedText = Buffer.concat([plaintext, paddingBuffer]);

  // 加密
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    AESKey,
    iv
  );
  cipher.setAutoPadding(false);

  const encrypted = Buffer.concat([
    cipher.update(paddedText),
    cipher.final()
  ]);

  // 合并 IV + 密文
  const result = Buffer.concat([iv, encrypted]);

  return result.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * 生成企业微信回调签名
 * @param token Token
 * @param timestamp 时间戳
 * @param nonce 随机字符串
 * @param encrypt 加密内容
 */
export function generateSignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypt: string
): string {
  const arr = [token, timestamp, nonce, encrypt].sort();
  const str = arr.join('');
  return crypto.createHash('sha1').update(str).digest('hex');
}

/**
 * 简单的重放攻击防护：检查时间戳是否在有效范围内
 * @param timestamp 时间戳（秒）
 * @param maxAgeMs 最大有效期（毫秒）
 */
export function isTimestampValid(timestamp: string, maxAgeMs: number = 5 * 60 * 1000): boolean {
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - ts);

  return diff * 1000 <= maxAgeMs;
}
