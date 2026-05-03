# 企业微信群自动接单/回单方案

## 一、先决条件（部署前必须满足）

> **你的情况**：企业微信群不是你们创建的（客户/对方建的群），但可以把你们的企业微信员工号加进去。这个情况**完全可行**。

### 三个必须满足的条件

| # | 条件 | 如何满足 | 责任人 |
|---|------|----------|--------|
| 1 | **你们有企业微信账号** | 注册企业微信（免费），完成企业认证 | 你们 |
| 2 | **每个客户群里有至少一个你们企微成员** | 让客户把你们企微员工号拉进群，或者你们企微成员主动加入 | 客户配合 / 你们 |
| 3 | **自建应用被添加到每个客户群里** | 企微管理后台创建自建应用，然后在每个群的设置中添加该应用 | 你们（管理员操作） |

### 条件 2 详解：怎么让企微员工进群

```
场景：客户用个人微信建了群，群里没有你们的人

操作步骤：
  1. 客户在群里点「+」→「添加成员」
  2. 搜索你们企微员工的名字或手机号
  3. 拉进群（客户操作，几秒钟的事）

或者反过来：
  1. 你们企微员工加客户为好友
  2. 让客户把你们拉进群
```

> **注意**：企业微信和个人微信的群是互通的。客户用个人微信建的群，企微员工可以直接加入，不需要客户用企微。

### 条件 3 详解：怎么把应用加到群里

```
在企业微信管理后台：
  1. 应用管理 → 创建自建应用
  2. 配置接收消息的回调 URL（指向你们服务器）
  3. 在手机企业微信里，进入客户群 → 群设置 → 添加应用 → 选择该应用

结果：该应用（机器人）就出现在群里了，能监听所有消息和文件。
```

### 大规模操作建议（50+ 群）

如果群很多，手动一个个加应用不现实。建议：

- **创建一个专用的企微员工号**（比如叫"订单助手"），只负责进群和拉应用
- 让所有客户群都加这个员工号
- 统一在后台把这些群的应用加上
- 未来新客户只需两步：①拉"订单助手"进群 ②群里加应用

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户微信群                                │
│  客户发 Excel 订单 → 自建应用监听到 → 自动下载                     │
│  订单完成后 ← 自建应用自动发回单 Excel ← 系统生成回单              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 回调推送
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              你们的服务器 (公网 HTTPS)                            │
│                                                                  │
│  /api/wecom/callback (回调入口)                                  │
│       │                                                          │
│       ├─ 1. 解密消息、验证签名                                    │
│       ├─ 2. 识别文件消息 → 写入处理队列                            │
│       └─ 3. 立即返回 success (3秒内必须响应)                       │
│                                                                  │
│  后台 Worker (src/server.ts 内置)                                 │
│       │                                                          │
│       ├─ 拉取队列 → 下载文件 → 解析 Excel                         │
│       ├─ 匹配客户 → 创建订单 → 发送"已接单"通知                    │
│       └─ 监听订单状态 → 导出回单 → 发回原群                        │
│                                                                  │
│  复用现有模块:                                                    │
│       ├─ parseExcelData() — Excel 解析                            │
│       ├─ POST /api/orders — 订单创建                              │
│       ├─ POST /api/export-feedback/batch — 回单导出               │
│       └─ export-artifacts.ts — 文件存储                           │
└─────────────────────────────────────────────────────────────────┘
```

### 企业微信回调消息中的关键字段

```
群消息回调 XML 中包含：

<xml>
  <ToUserName>企业CorpID</ToUserName>
  <AgentID>应用ID</AgentID>
  <ChatId>wrOXa9DwAAGg...</ChatId>     ← 群唯一 ID（系统内部用）
  <ChatName><![CDATA[张三贸易公司]]></ChatName>  ← 群名 = 客户名（匹配关键！！）
  <FromUserId>ZhangSan</FromUserId>    ← 发消息的人
  <MsgType>file</MsgType>              ← 消息类型
  <MediaId>3wG...8vL</MediaId>         ← 文件下载凭证
  <FileName><![CDATA[订单模板.xlsx]]></FileName>
  ...
</xml>
```

> **关键洞察**：`ChatName` 就是客户名，直接用它去 `customers` 表匹配，无需任何手动配置。

### 关键设计决策

**为什么用队列 + Worker 而不是在回调里直接处理？**

企业微信要求回调必须在 **3 秒内返回**（否则会重试），而下载文件、解析 Excel、匹配商品、创建订单这些操作可能需要 10-30 秒。所以：
- 回调只做：解密 → 验证 → 写入队列 → 返回成功（<100ms）
- Worker 异步处理后续所有步骤

---

## 三、核心流程

### 流程 A：自动接单（客户发 Excel → 系统创建订单）

```
1. 客户在群里上传 Excel 文件
2. 企业微信回调推送消息到 /api/wecom/callback
3. 系统解密消息，识别为 file 类型 (.xlsx/.xls)
4. **根据群名自动匹配客户**（群名 = 客户名，无需手动配置）：
   a. 从回调 XML 中提取群名 (ChatName)
   b. 在 customers 表中按名称/编码模糊匹配
   c. 命中 → 自动绑定，记录到 wecom_group_mappings
   d. 未命中 → 标记待确认，向群里发消息："未识别到客户，请联系管理员绑定"
5. 写入文件处理队列 (wecom_file_process_queue 表)
6. Worker 拉取队列任务：
   a. 调用企业微信 media/get API 下载文件
   b. 用现有 parseExcelData() 解析订单数据
   c. 自动匹配商品（复用现有产品匹配逻辑）
   d. 调用现有订单创建接口，写入 orders 表
   e. 向群里发送确认消息："已收到订单，共 X 条，正在处理中"
   f. （可选）发现异常时 @ 发送者提醒
7. 订单进入现有流程：pending → assigned → notified → returned → feedbacked → completed
```

### 流程 B：自动回单（订单完成 → 自动发回单到群里）

```
触发时机（二选一）：
  A. 定时扫描：Worker 每 10 分钟检查一次，找出状态变为 returned/feedbacked 的订单
  B. 事件驱动：在订单状态变更 API 中插入检查逻辑（更实时）

1. Worker 发现某客户有新的 returned/feedbacked 订单
2. 调用现有 /api/export-feedback/batch 生成回单 Excel
3. 调用企业微信 media/upload API 上传文件
4. 调用企业微信 message/send API 发送到原群
5. 消息内容："订单回单已生成，请查收" + 回单文件
6. 记录到 wecom_feedback_task 表，避免重复发送
```

### 流程 C：重复文件处理

```
1. 收到文件时，计算 msg_id 去重
2. 企业微信的 msg_id 对同一文件是唯一的
3. 如果队列中已有相同 msg_id → 标记为 duplicate，跳过
4. 如果同客户短时间内发来多个文件 → 分别处理（不同 msg_id）
```

---

## 四、数据库新增表

需要新增 **4 张表**：

### 1. `wecom_app_config` — 企微应用配置

```sql
CREATE TABLE wecom_app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  corp_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  token VARCHAR(100) NOT NULL,
  encoding_aes_key VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

支持配置多个应用（未来扩展）。

### 2. `wecom_group_mappings` — 群 → 客户映射

```sql
CREATE TABLE wecom_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES wecom_app_config(id),
  group_id VARCHAR(255) NOT NULL,          -- 企业微信群 ChatId
  group_name VARCHAR(500),                  -- 群名称 = 客户名（自动匹配用）
  customer_id UUID NOT NULL,                -- 对应系统客户 ID
  customer_code VARCHAR(100) NOT NULL,      -- 客户编码
  match_source VARCHAR(50) DEFAULT 'auto',  -- auto(群名自动匹配) / manual(人工绑定)
  is_active BOOLEAN DEFAULT true,
  auto_create_order BOOLEAN DEFAULT true,   -- 是否自动创建订单
  auto_send_feedback BOOLEAN DEFAULT true,  -- 是否自动发回单
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, group_id)
);
```

**这是核心映射表**：每个群对应一个客户，群里的订单文件自动归到该客户名下。

**自动匹配策略（群名 → 客户）**：

```
因为群名 = 客户名，所以匹配流程全自动：

1. 收到群消息时，回调 XML 中包含：
   - ChatId（群唯一 ID）
   - ChatName（群名称，即客户名称）

2. 首先查 wecom_group_mappings：
   - 已有映射 → 直接用
   - 没有映射 → 触发自动匹配

3. 自动匹配逻辑（按优先级）：
   a. 精确匹配：customers.name = ChatName
   b. 模糊匹配：customers.name ILIKE '%ChatName%' 或 ChatName ILIKE '%customers.name%'
   c. 别名匹配：customers.code = ChatName（客户可能用编码建群名）
   d. 都未命中 → 标记为 "unmapped"，通知管理员手动绑定

4. 匹配成功后：
   - 自动写入 wecom_group_mappings（下次同群直接命中）
   - 后续文件自动归到该客户名下
```

> **好处**：管理员无需任何手动配置。只要群名和客户名一致，新群自动识别。只有群名和客户名不一致的极端情况才需要人工处理。

### 3. `wecom_file_process_queue` — 文件处理队列

```sql
CREATE TABLE wecom_file_process_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES wecom_app_config(id),
  msg_id VARCHAR(255) NOT NULL,              -- 企微消息 ID（去重用）
  media_id VARCHAR(255),
  file_name VARCHAR(500),
  file_length BIGINT,
  group_id VARCHAR(255),
  from_user_id VARCHAR(255),                 -- 发文件的用户
  mapping_id UUID,                           -- 关联的群映射
  customer_id UUID,                          -- 解析出的客户
  status VARCHAR(50) DEFAULT 'pending',      -- pending/downloading/parsing/creating_orders/completed/failed/duplicate
  error_message TEXT,
  download_path TEXT,                         -- 下载后本地存储路径
  parsed_order_count INT,
  created_order_count INT,
  import_batch VARCHAR(255),                  -- 订单导入批次号
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(msg_id)
);
```

### 4. `wecom_feedback_tasks` — 回单发送记录

```sql
CREATE TABLE wecom_feedback_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES wecom_app_config(id),
  mapping_id UUID REFERENCES wecom_group_mappings(id),
  customer_id UUID NOT NULL,
  group_id VARCHAR(255) NOT NULL,
  order_ids TEXT[],                           -- 包含的订单 ID 列表
  orders_count INT DEFAULT 0,
  export_record_id UUID,                      -- 关联 export_records
  export_media_id VARCHAR(255),               -- 上传到企微的 media_id
  status VARCHAR(50) DEFAULT 'pending',       -- pending/exporting/uploading/sent/failed
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 五、代码模块划分

### 模块结构

```
src/lib/wecom/
  ├── types.ts          # 类型定义
  ├── crypto.ts         # AES 加解密 + 签名验证
  ├── message-parser.ts # XML 解析（依赖 fast-xml-parser）
  ├── api-client.ts     # 企微 API 客户端（token 缓存、media 上传下载、消息发送）
  ├── callback-handler.ts  # 回调处理主逻辑
  ├── file-processor.ts    # 文件下载 → 解析 → 创建订单 全链路
  └── feedback-sender.ts   # 回单导出 → 上传 → 发送

src/app/api/wecom/callback/
  └── route.ts          # Next.js API Route (处理 GET 验证 + POST 消息)

src/server.ts           # 修改：启动时初始化 Worker
```

### 各模块职责

| 模块 | 职责 | 复用现有 |
|------|------|----------|
| `crypto.ts` | AES-256-CBC 加解密、SHA1 签名验证 | 无 |
| `message-parser.ts` | XML ↔ 对象转换 | `fast-xml-parser`（需新增依赖） |
| `api-client.ts` | 企微 REST API 调用、token 缓存 | 无 |
| `callback-handler.ts` | 接收回调消息 → 写入队列 | 无 |
| `file-processor.ts` | 下载文件 → 调用现有解析/创建逻辑 | `parseExcelData()`, `POST /api/orders` 逻辑 |
| `feedback-sender.ts` | 导出回单 → 上传 → 发送到群 | `POST /api/export-feedback/batch` 逻辑 |

---

## 六、实施阶段

### 阶段 1：基础设施（3-5 天）

- [ ] 在企业微信管理后台创建自建应用
- [ ] 拿到 CorpID、AgentID、Secret、Token、EncodingAESKey
- [ ] 配置回调 URL（需要公网 HTTPS，你们服务器已有）
- [ ] 新建 4 张数据库迁移表
- [ ] 新增 `.env` 配置项
- [ ] 新增 `fast-xml-parser` 依赖

### 阶段 2：核心 SDK（3-5 天）

- [ ] `src/lib/wecom/crypto.ts` — 加解密实现
- [ ] `src/lib/wecom/message-parser.ts` — XML 解析
- [ ] `src/lib/wecom/api-client.ts` — API 客户端
- [ ] `src/lib/wecom/types.ts` — 类型定义
- [ ] 编写单元测试验证加解密正确性

### 阶段 3：回调接口（2-3 天）

- [ ] `src/app/api/wecom/callback/route.ts` — 回调端点
- [ ] `src/lib/wecom/callback-handler.ts` — 回调处理逻辑
- [ ] 在企业微信后台验证回调 URL 连通性
- [ ] 在测试群发送消息，确认回调能收到

### 阶段 4：自动接单（3-5 天）

- [ ] `src/lib/wecom/file-processor.ts` — 文件下载 + 解析 + 创建订单全链路
- [ ] `src/server.ts` — 内置 Worker 轮询队列
- [ ] 群 → 客户映射配置（先手动配，后续可加 UI）
- [ ] 消息通知（接单成功/失败时在群里发消息）
- [ ] 在测试群上传 Excel，验证端到端流程

### 阶段 5：自动回单（3-5 天）

- [ ] `src/lib/wecom/feedback-sender.ts` — 回单导出 + 发送
- [ ] Worker 增加回单扫描逻辑
- [ ] 去重逻辑（同一批订单不重复发回单）
- [ ] 在测试群验证回单自动发送

### 阶段 6：管理界面（可选，3-5 天）

- [ ] 群映射管理页面（列表、新增、编辑）
- [ ] 处理队列监控页面
- [ ] 回单发送记录查看
- [ ] 手动重试/重新发送功能

**总预估：14-26 个工作日**（根据前端页面需求的复杂度）

---

## 七、关键技术细节

### 7.1 企业微信消息加解密

企业微信使用的是 **AES-256-CBC**，不是文档里写的 AES-256-GCM（文档有误）：
- EncodingAESKey（43字符）→ Base64 解码得到 32字节 AES 密钥
- IV = AES 密钥的前 16 字节
- 加密前数据格式：`random(16字节) + msg_len(4字节大端序) + msg(明文) + corpId`
- 签名验证：`SHA1(sorted(token, timestamp, nonce, encrypt))`

### 7.2 回调必须 3 秒内响应

企微回调如果 3 秒内未收到 HTTP 200，会重试（最多 5 次）。所以回调里只做最小工作，所有耗时操作放入队列异步处理。

### 7.3 Access Token 缓存

- access_token 有效期 7200 秒
- 同企业下所有应用共享调用频率限制（2000次/分钟）
- 使用内存缓存 + 数据库持久化备份（防止服务重启后丢失）

### 7.4 文件下载限制

- media_id 有效期为 3 天
- 同一个 media_id 每天只能下载 3 次
- 建议下载后立即保存到本地/S3，后续使用不再调用企微 API

### 7.5 Worker 设计

Worker 在 `src/server.ts` 启动时初始化，不需要独立进程：

```typescript
// 伪代码示意
class WeComWorker {
  private running = false;
  private pollIntervalMs = 5000;  // 每 5 秒检查文件队列
  private feedbackIntervalMs = 600000; // 每 10 分钟检查回单

  async start() {
    this.running = true;
    this.pollFileQueue();
    this.pollFeedbackTasks();
  }

  private async pollFileQueue() {
    while (this.running) {
      const tasks = await db.getPendingFileTasks(5);
      for (const task of tasks) {
        await this.processFile(task);
      }
      await sleep(this.pollIntervalMs);
    }
  }

  private async pollFeedbackTasks() {
    while (this.running) {
      await this.scanAndSendFeedback();
      await sleep(this.feedbackIntervalMs);
    }
  }
}
```

### 7.6 容错与重试

- 文件处理失败 → 状态标记为 `failed`，记录错误原因，支持手动重试
- 企微 API 调用失败 → 指数退避重试（最多 3 次）
- Worker 崩溃 → 队列持久化在数据库，重启后继续处理
- 重复文件 → msg_id 唯一索引，直接跳过

---

## 八、可行性与风险评估

### 技术可行性：高 ✅

- 企业微信自建应用回调是官方支持的合规方案
- 所有必要的 API 都存在且稳定（回调、media 下载上传、消息发送）
- 项目已有的 Excel 解析、订单创建、回单导出逻辑可以直接复用
- 没有协议逆向或违规操作

### 主要风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 群映射配置错误 | 订单归错客户 | 支持手动校正、增加确认环节 |
| Excel 格式识别失败 | 订单无法解析 | 群里自动 @发送者 提示格式问题 |
| 大文件下载超时 | 处理失败 | 设置合理超时（60s），支持重试 |
| 企微 API 限流 | 批量操作变慢 | 实现请求队列、限速 |
| Worker 单点故障 | 队列堆积 | 数据库持久化 + 进程重启恢复 |

### 业务可行性：中 ⚠️

最大的风险不是技术，而是**群的管理权限**：
- 需要你们企微的成员在所有目标客户群里
- 需要把自建应用加到这些群里
- 如果客户自己建群，你们不在群里，就需要客户的配合（拉你们进群）

---

## 九、是否需要开始实施？

总结一下，这个方案在技术上是**完全可行的**。核心前提只有两个：

1. **你们企微成员在这些客户群里** — 如果不在，需要客户配合拉进群
2. **能把自建应用加到群里** — 这是企微后台一键操作

如果你认可这个方案，我们可以从阶段 1 开始实施。或者你对某些环节有疑问，我可以进一步细化。
