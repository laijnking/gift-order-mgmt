/**
 * WeCom Plugin - Message Parser
 * 企业微信 XML 消息解析
 */

import type { WeComCallbackXML, WeComFileMessage } from './types';

/**
 * Simple XML to object parser (regex-based, handles WeCom callback format)
 */
function parseXML(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const tagRegex = /<(\w+)><!\[CDATA\[([\s\S]*?)\]\]><\/\1>|<(\w+)>([\s\S]*?)<\/\3>/g;
  let match;
  
  while ((match = tagRegex.exec(xml)) !== null) {
    const key = match[1] || match[3];
    const value = match[2] || match[4];
    result[key] = value.trim();
  }
  
  return result;
}

/**
 * 解析企业微信回调 XML
 */
export async function parseCallbackXML(xml: string): Promise<WeComCallbackXML> {
  try {
    const parsed = parseXML(xml);
    return parsed as unknown as WeComCallbackXML;
  } catch {
    throw new Error('Invalid XML format');
  }
}

/**
 * 从解析后的 XML 提取文件消息
 */
export function extractFileMessage(xml: WeComCallbackXML): WeComFileMessage | null {
  if (xml.MsgType !== 'file') {
    return null;
  }

  const fileSize = xml.FileSize ? parseInt(xml.FileSize, 10) : 0;

  return {
    msgId: xml.MsgId || '',
    agentId: xml.AgentID || '',
    chatId: xml.ChatId || '',
    chatName: xml.ChatName || '',
    fromUserId: xml.FromUserName || '',
    fileName: xml.FileName || '',
    mediaId: xml.MediaId || '',
    fileSize,
    createTime: xml.CreateTime ? parseInt(xml.CreateTime, 10) : 0,
  };
}

/**
 * 检查文件扩展名是否为 Excel
 */
export function isExcelFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'xlsx' || ext === 'xls';
}

/**
 * 构建成功响应（用于 GET 回调验证）
 */
export function buildSuccessResponse(content: string): string {
  return content;
}

/**
 * 构建 XML 响应
 */
export function buildXMLResponse(message: string): string {
  return `<xml><return_code>0</return_code><return_msg>${message}</return_msg></xml>`;
}

/**
 * 构建成功回调响应
 */
export function buildSuccessCallbackResponse(): string {
  return `<xml><return_code><![CDATA[success]]></return_code><return_msg><![CDATA[ok]]></return_msg></xml>`;
}

/**
 * 构建错误回调响应
 */
export function buildErrorCallbackResponse(message: string): string {
  return `<xml><return_code><![CDATA[fail]]></return_code><return_msg><![CDATA[${message}]]></return_msg></xml>`;
}
