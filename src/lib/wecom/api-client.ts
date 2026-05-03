/**
 * WeCom Plugin - API Client
 * 企业微信 REST API 客户端
 */

import type {
  WeComAPIResponse,
  WeComAccessTokenResponse,
  WeComMediaUploadResponse,
  WeComMessageSendResponse,
  WeComAppConfig,
} from './types';

const BASE_URL = 'https://qyapi.weixin.qq.com';

interface TokenCache {
  token: string;
  expiresAt: number;
}

/**
 * 企业微信 API 客户端
 */
export class WeComAPIClient {
  private corpId: string;
  private agentId: string;
  private secret: string;
  private tokenCache: TokenCache | null = null;

  constructor(appConfig: Partial<WeComAppConfig>) {
    this.corpId = appConfig.corp_id || '';
    this.agentId = appConfig.agent_id || '';
    this.secret = appConfig.secret || '';
  }

  /**
   * 获取 Access Token（带缓存）
   */
  async getAccessToken(): Promise<string> {
    // 检查缓存是否有效（提前 5 分钟刷新）
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - 5 * 60 * 1000) {
      return this.tokenCache.token;
    }

    const url = `${BASE_URL}/cgi-bin/gettoken?corpid=${this.corpId}&corpsecret=${this.secret}`;
    const response = await fetch(url);
    const data = (await response.json()) as WeComAPIResponse<WeComAccessTokenResponse>;

    if (data.errcode !== 0) {
      throw new Error(`Failed to get access token: ${data.errmsg}`);
    }

    // 缓存 token
    this.tokenCache = {
      token: data.data!.access_token,
      expiresAt: Date.now() + data.data!.expires_in * 1000,
    };

    return data.data!.access_token;
  }

  /**
   * 下载媒体文件
   */
  async downloadMedia(mediaId: string): Promise<Buffer> {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/cgi-bin/media/get?access_token=${token}&media_id=${mediaId}`;

    const response = await fetch(url);

    // 检查是否返回错误（JSON 格式）
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as WeComAPIResponse;
      throw new Error(`Failed to download media: ${data.errmsg}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(fileBuffer: Buffer, fileName: string): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/cgi-bin/media/upload?access_token=${token}&type=file`;

    // 创建 FormData
    const formData = new FormData();
    const blob = new Blob([fileBuffer as unknown as BlobPart], { type: 'application/octet-stream' });
    formData.append('media', blob, fileName);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as WeComAPIResponse<WeComMediaUploadResponse>;

    if (data.errcode !== 0) {
      throw new Error(`Failed to upload media: ${data.errmsg}`);
    }

    return data.data!.media_id;
  }

  /**
   * 发送文本消息到群
   */
  async sendGroupTextMessage(chatId: string, content: string): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/cgi-bin/im/chat/send_msg?access_token=${token}`;

    const body = {
      chatid: chatId,
      msgtype: 'text',
      text: {
        content,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as WeComAPIResponse<WeComMessageSendResponse>;

    if (data.errcode !== 0) {
      throw new Error(`Failed to send message: ${data.errmsg}`);
    }

    return data.data?.msgid || '';
  }

  /**
   * 发送文件消息到群
   */
  async sendGroupFileMessage(chatId: string, mediaId: string): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/cgi-bin/im/chat/send_msg?access_token=${token}`;

    const body = {
      chatid: chatId,
      msgtype: 'file',
      file: {
        media_id: mediaId,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as WeComAPIResponse<WeComMessageSendResponse>;

    if (data.errcode !== 0) {
      throw new Error(`Failed to send file message: ${data.errmsg}`);
    }

    return data.data?.msgid || '';
  }

  /**
   * 发送文本+文件组合消息（先文本后文件）
   */
  async sendFeedbackMessage(chatId: string, textContent: string, fileBuffer: Buffer, fileName: string): Promise<void> {
    // 先发送文本消息
    await this.sendGroupTextMessage(chatId, textContent);

    // 上传文件并发送
    const mediaId = await this.uploadMedia(fileBuffer, fileName);
    await this.sendGroupFileMessage(chatId, mediaId);
  }
}

/**
 * 根据 App ID 获取 API 客户端实例
 */
export async function getWeComAPIClient(
  appId: string,
  getAppConfig: (appId: string) => Promise<{ corp_id: string; agent_id: string; secret: string } | null>
): Promise<WeComAPIClient | null> {
  const config = await getAppConfig(appId);
  if (!config) {
    return null;
  }
  return new WeComAPIClient(config);
}
