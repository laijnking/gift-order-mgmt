# 礼品订单管理系统 - 本地迁移还原指南

> 备份时间：2026-04-22  
> 备份文件：`gift-order-mgmt-complete-backup-20260422.tar.gz`

---

## 一、文件说明

### 备份包内容

| 文件 | 说明 |
|------|------|
| `gift-order-mgmt-complete-backup-20260422.tar.gz` | 完整项目代码 + 数据库备份 |
| `backup_db_20260422.sql` | PostgreSQL 数据库备份（已包含在压缩包内） |

### 数据库信息

| 项目 | 值 |
|------|-----|
| 数据库类型 | PostgreSQL 16 |
| 数据库名 | gift_order |
| 用户名 | postgres |
| 密码 | postgres123 |
| 端口 | 5432 |

---

## 二、还原步骤

### 步骤 1：解压备份包

```bash
# 解压到目标目录
tar -xzvf gift-order-mgmt-complete-backup-20260422.tar.gz

# 进入项目目录
cd gift-order-mgmt
```

### 步骤 2：安装依赖

```bash
# 使用 corepack 启用 pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 安装依赖
pnpm install
```

### 步骤 3：启动 PostgreSQL 数据库

**方式 A：使用 Docker（推荐）**

```bash
# 启动 PostgreSQL 容器
docker run -d \
  --name gift-order-mgmt-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=gift_order \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

**方式 B：使用 docker-compose**

```bash
# 启动数据库服务
docker compose up -d db

# 等待数据库就绪（约10秒）
sleep 10
```

### 步骤 4：还原数据库

```bash
# 提取数据库备份文件
tar -xzvf gift-order-mgmt-complete-backup-20260422.tar.gz backup_db_20260422.sql

# 还原数据库
docker exec -i gift-order-mgmt-db psql -U postgres -d gift_order < backup_db_20260422.sql

# 或直接使用压缩包内文件
cat backup_db_20260422.sql | docker exec -i gift-order-mgmt-db psql -U postgres -d gift_order
```

### 步骤 5：配置环境变量

```bash
# 复制环境变量示例文件
cp .env.docker .env.local

# 或手动创建 .env.local，内容如下：
cat > .env.local << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://postgres:postgres123@127.0.0.1:5432/gift_order

# 应用配置
NODE_ENV=development
PORT=3000

# 导出文件存储（本地模式）
EXPORT_ARTIFACT_PROVIDER=local
EXPORT_ARTIFACT_DIR=./data/exports

# Supabase 配置（本地开发）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
NEXT_PUBLIC_SUPABASE_DB_URL=postgresql://postgres:postgres123@127.0.0.1:5432/gift_order
COZE_SUPABASE_URL=http://localhost:3000
COZE_SUPABASE_ANON_KEY=local-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=local-service-role-key
EOF
```

### 步骤 6：启动应用

**开发模式：**
```bash
pnpm dev
```

**Docker 模式：**
```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看运行状态
docker compose ps
```

### 步骤 7：验证安装

```bash
# 测试登录（默认账号）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "username": "admin",
    "realName": "系统管理员",
    "role": "admin",
    ...
  }
}
```

---

## 三、默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 业务员 | salesperson | sales123 |
| 跟单员 | operator | operator123 |

---

## 四、常见问题

### Q1: 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 检查端口是否被占用
lsof -i :5432

# 重新启动数据库
docker restart gift-order-mgmt-db
```

### Q2: 依赖安装失败

```bash
# 清理缓存后重试
pnpm store prune
rm -rf node_modules
pnpm install
```

### Q3: 数据库还原失败

```bash
# 先创建空数据库
docker exec -i gift-order-mgmt-db psql -U postgres -c "DROP DATABASE IF EXISTS gift_order;"
docker exec -i gift-order-mgmt-db psql -U postgres -c "CREATE DATABASE gift_order;"

# 再还原数据
cat backup_db_20260422.sql | docker exec -i gift-order-mgmt-db psql -U postgres -d gift_order
```

### Q4: 端口冲突

修改 `docker-compose.yml` 中的端口映射：
```yaml
services:
  app:
    ports:
      - "3002:3000"  # 改为 3002:3000
```

---

## 五、目录结构

```
gift-order-mgmt/
├── src/                    # 源代码
│   ├── app/                # Next.js 应用
│   │   ├── (app)/         # 已认证页面
│   │   ├── api/           # API 路由
│   │   └── login/         # 登录页面
│   ├── components/         # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具库
│   ├── storage/           # 数据库访问层
│   └── types/             # TypeScript 类型
├── supabase/
│   └── migrations/         # 数据库迁移脚本
├── docs/                  # 项目文档
├── tests/                 # 测试文件
├── scripts/               # 构建和验证脚本
├── docker-compose.yml     # Docker 编排配置
├── Dockerfile             # 应用镜像构建文件
└── package.json           # 项目依赖
```

---

## 六、数据表说明

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| customers | 客户表 |
| suppliers | 供应商表 |
| products | 商品表 |
| stocks | 库存表 |
| warehouses | 仓库表 |
| orders | 订单表 |
| order_items | 订单明细表 |
| shipments | 发货记录表 |
| return_receipts | 回单表 |
| alert_rules | 预警规则表 |
| alert_records | 预警记录表 |
| templates | 导出模板表 |
| export_records | 导出记录表 |
| roles | 角色表 |
| permissions | 权限表 |

---

## 七、联系方式

如有问题，请联系开发团队。

---

*本文件由 Claude Code 自动生成*
*生成时间：2026-04-22*
