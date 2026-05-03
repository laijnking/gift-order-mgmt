/**
 * WeCom Plugin - Worker
 * 背景任务处理器：文件队列轮询 + 回单扫描
 */

import { getPgPool } from '@/storage/database/supabase-client';
import { processFileTask } from './file-processor';
import { scanAndProcessFeedback } from './feedback-sender';
import type { WeComFileTask, WeComWorkerConfig } from './types';

const DEFAULT_CONFIG: WeComWorkerConfig = {
  filePollIntervalMs: 5000,
  feedbackScanIntervalMs: 600000, // 10 分钟
  maxConcurrentFiles: 3,
  maxConcurrentFeedback: 1,
};

/**
 * WeCom Worker
 */
export class WeComWorker {
  private running = false;
  private config: WeComWorkerConfig;
  private activeFileTasks = 0;
  private activeFeedbackTasks = 0;
  private fileTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<WeComWorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 启动 Worker
   */
  async start(): Promise<void> {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id FROM wecom_app_config WHERE is_active = true AND deleted_at IS NULL LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('[WeComWorker] 没有激活的企微应用，Worker 不启动');
      return;
    }

    if (process.env.WECOM_WORKER_ENABLED !== 'true') {
      console.log('[WeComWorker] WECOM_WORKER_ENABLED != true，Worker 不启动');
      return;
    }

    this.running = true;
    console.log('[WeComWorker] 启动', {
      filePollInterval: this.config.filePollIntervalMs,
      feedbackScanInterval: this.config.feedbackScanIntervalMs,
      maxConcurrentFiles: this.config.maxConcurrentFiles,
      activeApps: result.rows.length,
    });

    this.pollFileQueue();
    this.pollFeedbackTasks();
  }

  /**
   * 停止 Worker
   */
  async stop(): Promise<void> {
    console.log('[WeComWorker] 收到关闭信号，等待活跃任务完成...');
    this.running = false;

    if (this.fileTimer) clearTimeout(this.fileTimer);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);

    const deadline = Date.now() + 30000;
    while ((this.activeFileTasks > 0 || this.activeFeedbackTasks > 0) && Date.now() < deadline) {
      await this.sleep(500);
    }

    console.log('[WeComWorker] 已关闭', {
      remainingFileTasks: this.activeFileTasks,
      remainingFeedbackTasks: this.activeFeedbackTasks,
    });
  }

  /**
   * 文件队列轮询
   */
  private pollFileQueue(): void {
    if (!this.running) return;

    const poll = async () => {
      try {
        const available = this.config.maxConcurrentFiles - this.activeFileTasks;
        if (available > 0) {
          const tasks = await this.fetchPendingFileTasks(available);
          for (const task of tasks) {
            this.activeFileTasks++;
            this.processFileAsync(task).finally(() => {
              this.activeFileTasks--;
            });
          }
        }
      } catch (err) {
        console.error('[WeComWorker] 文件队列轮询异常:', err);
      }

      if (this.running) {
        this.fileTimer = setTimeout(poll, this.config.filePollIntervalMs);
      }
    };

    poll();
  }

  /**
   * 回单扫描轮询
   */
  private pollFeedbackTasks(): void {
    if (!this.running) return;

    const poll = async () => {
      try {
        if (this.activeFeedbackTasks < this.config.maxConcurrentFeedback) {
          await this.processFeedbackAsync();
        }
      } catch (err) {
        console.error('[WeComWorker] 回单扫描异常:', err);
      }

      if (this.running) {
        this.feedbackTimer = setTimeout(poll, this.config.feedbackScanIntervalMs);
      }
    };

    poll();
  }

  /**
   * 获取待处理的文件任务（FOR UPDATE SKIP LOCKED 原子锁定）
   */
  private async fetchPendingFileTasks(limit: number): Promise<WeComFileTask[]> {
    const pool = getPgPool();

    // 使用 CTE 实现 FOR UPDATE SKIP LOCKED 原子锁定
    // 先锁定行，再更新状态为 downloading，防止多 Worker 实例竞态
    const result = await pool.query(
      `WITH locked AS (
        SELECT id FROM wecom_file_process_queue
        WHERE status = 'pending'
          AND retry_count < max_retries
        ORDER BY created_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE wecom_file_process_queue
      SET status = 'downloading', updated_at = NOW()
      FROM locked
      WHERE wecom_file_process_queue.id = locked.id
      RETURNING wecom_file_process_queue.*`,
      [limit]
    );

    return result.rows as WeComFileTask[];
  }

  /**
   * 异步处理文件
   */
  private async processFileAsync(task: WeComFileTask): Promise<void> {
    try {
      console.log(`[WeComWorker] 开始处理文件任务 ${task.id}: ${task.file_name}`);
      const result = await processFileTask(task);
      if (result.success) {
        console.log(`[WeComWorker] 文件任务 ${task.id} 完成，创建 ${result.createdOrderIds?.length || 0} 个订单`);
      } else {
        console.error(`[WeComWorker] 文件任务 ${task.id} 失败: ${result.error}`);
      }
    } catch (err) {
      console.error(`[WeComWorker] 处理文件任务 ${task.id} 异常:`, err);
    }
  }

  /**
   * 异步处理回单
   */
  private async processFeedbackAsync(): Promise<void> {
    this.activeFeedbackTasks++;
    try {
      const result = await scanAndProcessFeedback();
      if (result.processed > 0) {
        console.log(`[WeComWorker] 回单处理完成: ${result.processed} 个任务`);
      }
      if (result.errors.length > 0) {
        console.error(`[WeComWorker] 回单处理错误:`, result.errors);
      }
    } finally {
      this.activeFeedbackTasks--;
    }
  }

  /**
   * 睡眠工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 单例 Worker 实例
let workerInstance: WeComWorker | null = null;

/**
 * 获取或创建 Worker 实例
 */
export function getWeComWorker(): WeComWorker {
  if (!workerInstance) {
    workerInstance = new WeComWorker();
  }
  return workerInstance;
}

/**
 * 启动 Worker（供 server.ts 调用）
 */
export async function startWeComWorker(): Promise<void> {
  const worker = getWeComWorker();
  await worker.start();
}

/**
 * 停止 Worker（供 server.ts 调用）
 */
export async function stopWeComWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.stop();
    workerInstance = null;
  }
}
