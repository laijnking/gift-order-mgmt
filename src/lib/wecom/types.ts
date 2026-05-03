/**
 * WeCom Plugin - Type Definitions
 * 企业微信插件类型定义
 */

// ============================================================
// 企微回调消息类型
// ============================================================

export interface WeComCallbackXML {
  ToUserName?: string;
  FromUserName?: string;
  CreateTime?: string;
  MsgType?: string;
  Content?: string;
  MsgId?: string;
  AgentID?: string;
  // 群消息特有字段
  ChatId?: string;
  ChatName?: string;
  // 文件消息特有字段
  Title?: string;
  Description?: string;
  FileKey?: string;
  MediaId?: string;
  FileName?: string;
  FileSize?: string;
  // 加密消息字段
  Encrypt?: string;
  encrypt?: string;
}

export interface WeComCallbackPayload {
  msgSignature: string;
  timestamp: string;
  nonce: string;
  echostr?: string;
  encrypt?: string;
  msgEncrypt?: string;
}

export interface WeComFileMessage {
  msgId: string;
  agentId: string;
  chatId: string;
  chatName: string;
  fromUserId: string;
  fileName: string;
  mediaId: string;
  fileSize: number;
  createTime: number;
}

export interface WeComTextMessage {
  msgId: string;
  agentId: string;
  chatId: string;
  fromUserId: string;
  content: string;
  createTime: number;
}

// ============================================================
// 数据库记录类型
// ============================================================

export interface WeComAppConfig {
  id: string;
  name: string;
  corp_id: string;
  agent_id: string;
  secret: string;
  token: string;
  encoding_aes_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WeComGroupMapping {
  id: string;
  app_id: string;
  group_id: string;
  group_name: string | null;
  customer_id: string | null;
  match_source: 'auto' | 'manual';
  match_score: number;
  is_active: boolean;
  auto_create_order: boolean;
  auto_send_feedback: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WeComFileTask {
  id: string;
  app_id: string | null;
  msg_id: string;
  media_id: string | null;
  file_name: string | null;
  file_length: number | null;
  group_id: string | null;
  group_name: string | null;
  from_user_id: string | null;
  mapping_id: string | null;
  customer_id: string | null;
  status: WeComFileTaskStatus;
  error_message: string | null;
  download_path: string | null;
  parsed_order_count: number;
  created_order_count: number;
  import_batch: string | null;
  retry_count: number;
  max_retries: number;
  last_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WeComFileTaskStatus =
  | 'pending'
  | 'downloading'
  | 'parsing'
  | 'creating_orders'
  | 'completed'
  | 'failed'
  | 'duplicate';

export interface WeComFeedbackTask {
  id: string;
  app_id: string | null;
  mapping_id: string | null;
  customer_id: string;
  group_id: string;
  order_ids: string[];
  orders_count: number;
  export_media_id: string | null;
  status: WeComFeedbackTaskStatus;
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type WeComFeedbackTaskStatus =
  | 'pending'
  | 'exporting'
  | 'uploading'
  | 'sent'
  | 'failed';

// ============================================================
// 客户匹配结果
// ============================================================

export interface CustomerMatchResult {
  customerId: string | null;
  mappingId: string | null;
  customerCode: string | null;
  customerName: string | null;
  score: number;
  isUnmapped: boolean;
  matchSource: 'auto' | 'manual' | null;
}

// ============================================================
// Worker 配置
// ============================================================

export interface WeComWorkerConfig {
  filePollIntervalMs: number;
  feedbackScanIntervalMs: number;
  maxConcurrentFiles: number;
  maxConcurrentFeedback: number;
}

// ============================================================
// API 响应类型
// ============================================================

export interface WeComAPIResponse<T = unknown> {
  errcode: number;
  errmsg: string;
  data?: T;
}

export interface WeComAccessTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface WeComMediaUploadResponse {
  media_id: string;
  created_at: string;
}

export interface WeComMessageSendResponse {
  errcode: number;
  errmsg: string;
  msgid?: string;
}
