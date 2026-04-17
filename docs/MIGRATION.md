# 礼品订单管理系统 - 服务器迁移初始化文档

## 一、项目信息

| 项目 | 值 |
|------|-----|
| 项目名称 | 礼品订单管理系统 (Gift Order Management System) |
| 技术栈 | Next.js 16 + React 19 + TypeScript + Supabase |
| 端口 | 5000 |
| 包管理器 | pnpm (必须使用，禁止 npm/yarn) |
| Node版本 | Node.js 20+ |

---

## 二、服务器环境要求

### 2.1 系统要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 1核 | 2核+ |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 10GB | 20GB+ |
| 系统 | Ubuntu 20.04+ / CentOS 7+ | Ubuntu 22.04 LTS |

### 2.2 软件依赖

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm (必须)
npm install -g pnpm

# Git
sudo apt-get install -y git
```

---

## 三、项目部署步骤

### 3.1 方式一：新服务器全新部署

#### Step 1: 拉取代码

```bash
# 方式A: 从 Git 拉取
git clone <仓库地址> /path/to/projects
cd /path/to/projects

# 方式B: 从现有服务器复制（如果可以访问）
scp -r user@old-server:/path/to/projects/* user@new-server:/path/to/projects/
```

#### Step 2: 安装依赖

```bash
cd /path/to/projects

# 使用 pnpm 安装依赖（必须）
pnpm install
```

#### Step 3: 配置环境变量

创建 `.env.local` 文件：

```bash
# 在项目根目录创建
touch .env.local
```

编辑 `.env.local`：

```env
# ====================
# Supabase 数据库配置
# ====================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 如果使用服务密钥（服务端）
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ====================
# 平台配置（Coze CLI 自动注入）
# ====================
COZE_WORKSPACE_PATH=/path/to/projects
COZE_PROJECT_DOMAIN_DEFAULT=https://your-domain.com
DEPLOY_RUN_PORT=5000
COZE_PROJECT_ENV=PROD
```

#### Step 4: 数据库初始化

```bash
# 方式A: Supabase SQL Editor
# 1. 登录 https://supabase.com/dashboard
# 2. 选择项目 → SQL Editor
# 3. 复制粘贴 schema.sql 内容并执行

# 方式B: psql 命令行
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" -f data/schema.sql

# 方式C: 导入测试数据（如需要）
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" -f data/import_data.sql
```

#### Step 5: 构建并启动

```bash
# 构建生产版本
pnpm build

# 启动服务
pnpm start
```

---

### 3.2 方式二：使用 Coze CLI

如果目标服务器已安装 Coze CLI：

```bash
# 进入项目目录
cd /path/to/projects

# 安装依赖并启动开发/生产模式
coze dev    # 开发模式
coze build  # 构建
coze start  # 生产启动
```

---

### 3.3 方式三：PM2 进程管理（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd /path/to/projects
pm2 start pnpm --name "gift-order" -- start

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

常用命令：

```bash
pm2 list              # 查看进程列表
pm2 logs gift-order   # 查看日志
pm2 restart gift-order   # 重启
pm2 stop gift-order  # 停止
pm2 delete gift-order # 删除
```

---

## 四、数据迁移

### 4.1 数据库建表（全新部署）

```bash
# 执行建表脚本
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" -f data/schema.sql
```

建表脚本包含：
- 32张表的完整DDL（CREATE TABLE）
- 预设用户、角色、预警规则、发货通知模板
- RLS策略配置

### 4.2 数据库迁移（数据迁移）

如果需要迁移 Supabase 数据：

#### 方法A: Supabase Dashboard 导出/导入

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → Table Editor → 选择表 → Export CSV
3. 目标服务器新建项目 → 导入 CSV

#### 方法B: SQL 脚本迁移

```bash
# 导出数据
pg_dump "postgresql://postgres:[PASSWORD]@db.OLD-PROJECT.supabase.co:5432/postgres" > backup.sql

# 导入数据
psql "postgresql://postgres:[PASSWORD]@db.NEW-PROJECT.supabase.co:5432/postgres" < backup.sql
```

### 4.3 迁移数据表清单

| 序号 | 表名 | 说明 | 优先级 |
|------|------|------|--------|
| 1 | customers | 客户档案 | 高 |
| 2 | products | 商品档案 | 高 |
| 3 | shippers | 发货方档案 | 高 |
| 4 | suppliers | 供应商 | 高 |
| 5 | warehouses | 仓库档案 | 中 |
| 6 | orders | 订单 | 高 |
| 7 | stocks | 库存 | 高 |
| 8 | users | 用户 | 高 |
| 9 | templates | 模板配置 | 中 |
| 10 | product_mappings | SKU映射 | 中 |
| 11 | alert_rules | 预警规则 | 中 |
| 12 | roles | 角色配置 | 低 |

### 4.3 历史数据文件

位置：`/path/to/projects/assets/`

包含测试订单、供应商发单模板等，可按需迁移。

---

## 五、配置文件说明

### 5.1 .coze

项目启动配置，由 Coze CLI 使用：

```toml
[project]
requires = ["nodejs-20"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "dev", "--port", "5000", "--host"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
```

### 5.2 package.json

关键配置：

```json
{
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "pnpm": ">=9.0.0"
  }
}
```

---

## 六、迁移检查清单

### 6.1 迁移前检查

- [ ] 确认目标服务器 Node.js 版本 >= 20
- [ ] 确认 pnpm 已安装
- [ ] 获取新的 Supabase URL 和密钥
- [ ] 备份现有数据
- [ ] 记录现有环境变量值

### 6.2 迁移后验证

- [ ] 服务启动成功（`curl http://localhost:5000`）
- [ ] 登录页面可访问
- [ ] 数据库连接正常
- [ ] 用户登录测试
- [ ] 订单导入功能测试
- [ ] 发货通知导出测试

### 6.3 验证命令

```bash
# 1. 检查服务状态
curl -I http://localhost:5000

# 2. 检查端口监听
ss -tuln | grep 5000

# 3. 查看服务日志
pm2 logs gift-order --lines 50

# 4. 测试数据库连接
curl -s http://localhost:5000/api/health
```

---

## 七、常见问题

### Q1: pnpm 安装失败

```bash
# 使用官方脚本安装
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 或使用 npm 安装
npm install -g pnpm
```

### Q2: 端口被占用

```bash
# 查看端口占用
ss -tuln | grep 5000

# 杀死占用进程
kill -9 <PID>
```

### Q3: Supabase 连接失败

1. 检查 `.env.local` 中的 URL 和密钥是否正确
2. 确认 Supabase 项目状态正常
3. 检查 IP 白名单设置

### Q4: 构建失败

```bash
# 清理缓存重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 八、新 Supabase 项目创建

如果需要创建新的 Supabase 项目：

1. 登录 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取 Project URL 和 anon key
4. 在 SQL Editor 中执行建表脚本
5. 更新 `.env.local`

### 建表脚本位置

```
data/schema.sql            # 完整建表脚本（32张表 + 预设数据 + RLS策略）
data/import_data.sql       # 商品档案数据
data/import_all_data.sql   # 完整数据导入
```

---

## 九、快速启动命令汇总

```bash
# 完整部署命令
cd /path/to/projects
pnpm install
pnpm build
pnpm start

# 或使用 Coze CLI
coze dev

# 使用 PM2（生产环境推荐）
pm2 start pnpm --name "gift-order" -- start
```

---

## 十、联系与支持

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Next.js 文档**: https://nextjs.org/docs
- **项目文档**: `docs/` 目录
