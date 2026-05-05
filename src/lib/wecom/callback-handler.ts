/**
 * WeCom Plugin - Callback Handler
 * 回调处理主逻辑
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifySignature, decryptMessage, isTimestampValid } from './crypto';
import { parseCallbackXML, extractFileMessage, isExcelFile, buildSuccessCallbackResponse, buildErrorCallbackResponse } from './message-parser';
import { matchCustomerForGroup, upsertGroupMapping } from './customer-matcher';
import type { WeComAppConfig, WeComFileTask } from './types';

/**
 * 对企业微信回调参数进行 URL Decode 处理
 */
function decodeUrlParams(param: string | null): string {
  if (!param) return '';
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

const MAX_FILE_SIZE_MB = parseInt(process.env.WECOM_MAX_FILE_SIZE_MB || '10', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface CallbackContext {
  appConfig: WeComAppConfig;
}

/**
 * 验证并获取企微应用配置
 */
async function verifyAndGetApp(request: Request): Promise<CallbackContext | null> {
  const url = new URL(request.url);
  const agentId = url.searchParams.get('agentid');

  if (!agentId) {
    return null;
  }

  const client = getSupabaseClient();
  const { data: appConfig } = await client
    .from('wecom_app_config')
    .select('*')
    .eq('agent_id', agentId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (!appConfig) {
    return null;
  }

  return { appConfig };
}

/**
 * 处理文件消息
 */
async function handleFileMessage(
  context: CallbackContext,
  fileMessage: {
    msgId: string;
    mediaId: string;
    fileName: string;
    fileSize: number;
    groupId: string;
    groupName: string;
    fromUserId: string;
  }
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();

  // 1. 检查文件大小
  if (fileMessage.fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      message: `文件过大，超过 ${MAX_FILE_SIZE_MB}MB 限制`,
    };
  }

  // 2. 检查是否为 Excel 文件
  if (!isExcelFile(fileMessage.fileName)) {
    return {
      success: false,
      message: `不支持的文件类型，仅支持 xlsx/xls`,
    };
  }

  // 3. 检查重复消息（通过 msg_id）
  const { data: existingTask } = await client
    .from('wecom_file_process_queue')
    .select('id, status')
    .eq('msg_id', fileMessage.msgId)
    .maybeSingle();

  if (existingTask) {
    if (existingTask.status === 'duplicate') {
      return { success: true, message: '重复消息，已跳过' };
    }
    // 如果已存在且不是 duplicate，可能是重试
    return { success: true, message: '消息已存在' };
  }

  // 4. 匹配客户
  const matchResult = await matchCustomerForGroup(fileMessage.groupId, fileMessage.groupName);

  // 5. 如果自动匹配成功，创建映射
  if (!matchResult.isUnmapped && !matchResult.mappingId) {
    try {
      const mappingId = await upsertGroupMapping(
        context.appConfig.id,
        fileMessage.groupId,
        fileMessage.groupName,
        matchResult
      );
      matchResult.mappingId = mappingId;
    } catch (err) {
      console.error('[WeComCallback] Failed to create mapping:', err);
    }
  }

  // 6. 写入处理队列
  const { error: insertError } = await client
    .from('wecom_file_process_queue')
    .insert({
      app_id: context.appConfig.id,
      msg_id: fileMessage.msgId,
      media_id: fileMessage.mediaId,
      file_name: fileMessage.fileName,
      file_length: fileMessage.fileSize,
      group_id: fileMessage.groupId,
      group_name: fileMessage.groupName,
      from_user_id: fileMessage.fromUserId,
      mapping_id: matchResult.mappingId,
      customer_id: matchResult.customerId,
      status: 'pending',
    });

  if (insertError) {
    if (insertError.code === '23505') {
      // 唯一约束冲突，消息已存在
      return { success: true, message: '消息已存在' };
    }
    console.error('[WeComCallback] Failed to insert task:', insertError);
    return { success: false, message: '写入队列失败' };
  }

  return {
    success: true,
    message: `已接收文件，等待处理`,
  };
}

/**
 * 处理回调请求（主入口）
 */
export async function handleCallback(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    // GET 请求：验证回调 URL
    if (request.method === 'GET') {
      // 企业微信文档要求对参数进行 URL Decode 处理
      const msgSignature = decodeUrlParams(url.searchParams.get('msg_signature'));
      const timestamp = decodeUrlParams(url.searchParams.get('timestamp'));
      const nonce = decodeUrlParams(url.searchParams.get('nonce'));
      const echostr = decodeUrlParams(url.searchParams.get('echostr'));

      console.log('[WeComCallback] Verification request:', { msgSignature, timestamp, nonce, echostr: echostr?.substring(0, 20) + '...' });

      if (!msgSignature || !timestamp || !nonce || !echostr) {
        return new Response(buildErrorCallbackResponse('Missing parameters'), {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 验证并获取应用配置
      const context = await verifyAndGetApp(request);
      if (!context) {
        console.log('[WeComCallback] App not found for agentId:', url.searchParams.get('agentid'));
        return new Response(buildErrorCallbackResponse('App not found'), {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 验证签名并解密 echostr
      const isValid = verifySignature(
        context.appConfig.token,
        msgSignature,
        timestamp,
        nonce,
        echostr
      );

      if (!isValid) {
        console.log('[WeComCallback] Signature verification failed');
        return new Response(buildErrorCallbackResponse('Signature verification failed'), {
          status: 401,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 解密
      let decryptedEchostr: string;
      try {
        decryptedEchostr = decryptMessage(context.appConfig.encoding_aes_key, echostr);
        console.log('[WeComCallback] Decrypted echostr length:', decryptedEchostr.length);
      } catch (err) {
        console.error('[WeComCallback] Failed to decrypt echostr:', err);
        return new Response(buildErrorCallbackResponse('Decryption failed'), {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 返回明文消息内容（不能加引号，不能带换行符）
      return new Response(decryptedEchostr, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // POST 请求：处理回调消息
    if (request.method === 'POST') {
      const msgSignature = decodeUrlParams(url.searchParams.get('msg_signature'));
      const timestamp = decodeUrlParams(url.searchParams.get('timestamp'));
      const nonce = decodeUrlParams(url.searchParams.get('nonce'));

      if (!msgSignature || !timestamp || !nonce) {
        return new Response(buildErrorCallbackResponse('Missing parameters'), {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 验证时间戳（防止重放攻击）
      if (!isTimestampValid(timestamp)) {
        return new Response(buildErrorCallbackResponse('Timestamp expired'), {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 验证并获取应用配置
      const context = await verifyAndGetApp(request);
      if (!context) {
        return new Response(buildErrorCallbackResponse('App not found'), {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 获取请求体
      const body = await request.text();

      // 解析 XML
      let xmlData;
      try {
        xmlData = await parseCallbackXML(body);
      } catch (err) {
        console.error('[WeComCallback] Failed to parse XML:', err);
        return new Response(buildSuccessCallbackResponse(), {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // 检查是否有加密内容
      const encrypt = xmlData.Encrypt || xmlData.encrypt;
      if (encrypt) {
        // 验证签名
        const isValid = verifySignature(
          context.appConfig.token,
          msgSignature,
          timestamp,
          nonce,
          encrypt
        );

        if (!isValid) {
          return new Response(buildErrorCallbackResponse('Signature verification failed'), {
            status: 401,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // 解密消息
        let decryptedMessage: string;
        try {
          decryptedMessage = decryptMessage(context.appConfig.encoding_aes_key, encrypt);
        } catch (err) {
          console.error('[WeComCallback] Failed to decrypt message:', err);
          return new Response(buildSuccessCallbackResponse(), {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // 重新解析解密后的消息
        try {
          xmlData = await parseCallbackXML(decryptedMessage);
        } catch (err) {
          console.error('[WeComCallback] Failed to parse decrypted XML:', err);
          return new Response(buildSuccessCallbackResponse(), {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      }

      // 提取文件消息
      const fileMessage = extractFileMessage(xmlData);
      if (fileMessage) {
        const result = await handleFileMessage(context, {
          msgId: fileMessage.msgId,
          mediaId: fileMessage.mediaId,
          fileName: fileMessage.fileName,
          fileSize: fileMessage.fileSize,
          groupId: fileMessage.chatId,
          groupName: fileMessage.chatName,
          fromUserId: fileMessage.fromUserId,
        });

        console.log(`[WeComCallback] File message processed: ${result.message}`);
      }

      // 立即返回成功（企业微信要求 3 秒内响应）
      return new Response(buildSuccessCallbackResponse(), {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response(buildErrorCallbackResponse('Method not allowed'), {
      status: 405,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err) {
    console.error('[WeComCallback] Unexpected error:', err);
    // 即使出错也返回成功，避免企微无限重试
    return new Response(buildSuccessCallbackResponse(), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
