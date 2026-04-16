# 部署文档

## 1. 环境信息

### 1.1 生产环境

| 项目 | 值 |
|------|-----|
| 域名 | https://abc123.dev.coze.site |
| 端口 | 5000 |
| 协议 | HTTPS |

### 1.2 开发环境

| 项目 | 值 |
|------|-----|
| 本地端口 | 5000 |
| 数据库 | Supabase (开发) |

---

## 2. 部署方式

### 2.1 使用 Coze CLI

项目已配置 Coze CLI，支持以下命令：

```bash
# 安装依赖
pnpm install

# 开发模式（热更新）
pnpm dev

# 生产构建
pnpm build

# 生产启动
pnpm start
```

### 2.2 配置文件

`.coze` 文件已预置配置：

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "dev", "--port", "5000", "--host"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
```

---

## 3. 环境变量

### 3.1 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `COZE_WORKSPACE_PATH` | 项目根目录 | `/workspace/projects/` |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 访问域名 | `https://abc123.dev.coze.site` |
| `DEPLOY_RUN_PORT` | 服务端口 | `5000` |
| `COZE_PROJECT_ENV` | 环境标识 | `PROD` |

### 3.2 Supabase 配置

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |

---

## 4. 数据库配置

### 4.1 Supabase 连接

数据库客户端位于：`src/storage/database/supabase-client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 4.2 表结构

所有表结构详见 [DATABASE.md](./DATABASE.md)

### 4.3 RLS 策略

所有表已启用 Row Level Security，配置公开读写策略。

---

## 5. 部署步骤

### 5.1 首次部署

```bash
# 1. 进入项目目录
cd /workspace/projects

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 4. 构建生产版本
pnpm build

# 5. 启动服务
pnpm start
```

### 5.2 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 安装新依赖
pnpm install

# 3. 重新构建
pnpm build

# 4. 重启服务
pm2 restart gift-order-system
# 或
pkill -f "next start" && pnpm start
```

---

## 6. 服务管理

### 6.1 PM2 管理

```bash
# 启动服务
pm2 start pnpm --name "gift-order" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs gift-order

# 重启
pm2 restart gift-order

# 停止
pm2 stop gift-order
```

### 6.2 日志查看

```bash
# 应用日志
tail -f /app/work/logs/bypass/app.log

# 开发日志
tail -f /app/work/logs/bypass/dev.log

# 控制台日志
tail -f /app/work/logs/bypass/console.log
```

---

## 7. 监控告警

### 7.1 健康检查

```bash
# 检查服务状态
curl -I http://localhost:5000

# 检查 API
curl http://localhost:5000/api/alert-rules
```

### 7.2 错误监控

检查日志中的 ERROR、Exception、Traceback 关键字：

```bash
grep -iE "error|exception" /app/work/logs/bypass/app.log
```

---

## 8. 备份恢复

### 8.1 数据库备份

Supabase 提供自动备份，也可手动导出：

```sql
-- 导出数据
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### 8.2 配置备份

- `.env.local` 文件
- `supabase` 配置

---

## 9. 故障排查

### 9.1 服务无法启动

```bash
# 1. 检查端口占用
ss -tuln | grep 5000

# 2. 查看启动日志
pnpm start 2>&1

# 3. 检查依赖安装
pnpm install
```

### 9.2 API 请求失败

```bash
# 1. 检查 Supabase 连接
curl -I https://xxx.supabase.co

# 2. 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
```

### 9.3 数据库连接错误

```bash
# 1. 检查 Supabase 状态
curl -I https://status.supabase.com

# 2. 验证 API Key
curl -H "apikey: xxx" https://xxx.supabase.co/rest/v1/
```

---

## 10. 回滚方案

### 10.1 代码回滚

```bash
# 查看最近提交
git log --oneline -5

# 回滚到上一个版本
git revert HEAD

# 或者强制回滚
git reset --hard HEAD~1
```

### 10.2 数据库回滚

通过 Supabase Dashboard 或备份文件恢复。

---

## 11. 运维清单

### 部署前检查

- [ ] 代码已通过 ESLint 检查
- [ ] 所有 API 接口已测试
- [ ] 环境变量已配置
- [ ] 数据库连接正常

### 部署后检查

- [ ] 服务端口正常监听
- [ ] 首页可访问
- [ ] 登录功能正常
- [ ] 核心功能可用

### 监控检查

- [ ] 日志无异常
- [ ] API 响应正常
- [ ] 数据库连接稳定
