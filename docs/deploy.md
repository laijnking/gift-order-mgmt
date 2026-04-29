# 生产环境部署文档

## 服务器信息

| 项目 | 信息 |
|------|------|
| IP | `1.95.139.195` |
| 用户 | `LP` |
| 项目目录 | `/data/project` |
| 运行端口 | `5000`（由 `src/server.ts` 自定义服务器监听） |
| 进程管理 | systemd (`gift-order-mgmt.service`) |
| 数据库 | PostgreSQL 16，本地 `localhost:5432` |

## 技术栈

- Node.js 20（`/usr/local/bin/node`）
- pnpm 9.15.9（`/usr/local/bin/pnpm`）
- Next.js 16（standalone 模式输出到 `.next/standalone/`）
- 自定义服务器入口 `src/server.ts`，由 tsup 编译为 CJS 输出到 `dist/server.js`

## 构建流程

构建脚本 `scripts/build.sh` 执行三步：

```bash
#!/bin/bash
# 1. 安装依赖
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

# 2. Next.js 生产构建（standalone 输出）
pnpm next build

# 3. 编译自定义服务器到 dist/server.js
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
```

## 部署步骤

### 日常更新部署

```bash
# 1. SSH 登录
ssh LP@1.95.139.195

# 2. 进入项目目录
cd /data/project

# 3. 拉取最新代码
git pull origin feature/local-0424-merge

# 4. 安装依赖（如有更新）
pnpm install --prefer-frozen-lockfile --prefer-offline

# 5. 生产构建
pnpm build

# 6. 重启服务
sudo systemctl restart gift-order-mgmt

# 7. 检查服务状态
sudo systemctl status gift-order-mgmt
```

### 部署其他分支

```bash
cd /data/project
git fetch origin
git checkout <branch-name>
git pull origin <branch-name>
pnpm install --prefer-frozen-lockfile --prefer-offline
pnpm build
sudo systemctl restart gift-order-mgmt
```

## 服务管理

### systemd 服务配置

服务文件：`/etc/systemd/system/gift-order-mgmt.service`

```ini
[Unit]
Description=Gift Order Management System (Unattended)
After=network.target postgresql.service

[Service]
Type=simple
User=LP
WorkingDirectory=/data/project
EnvironmentFile=/tmp/gift-order-mgmt.env
ExecStart=/usr/local/bin/node /data/project/dist/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 常用命令

```bash
sudo systemctl restart gift-order-mgmt   # 重启
sudo systemctl stop gift-order-mgmt      # 停止
sudo systemctl start gift-order-mgmt     # 启动
sudo systemctl status gift-order-mgmt    # 查看状态
sudo journalctl -u gift-order-mgmt -f    # 查看实时日志
sudo journalctl -u gift-order-mgmt -n 100 # 查看最近 100 行日志
```

## 环境变量

环境变量文件：`/tmp/gift-order-mgmt.env`

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | `postgresql://postgres:postgres123@localhost:5432/gift_order` |
| `APP_BIND_HOST` | `0.0.0.0` |
| `APP_PORT` | `3001` |
| `PUBLIC_APP_URL` | `http://166.108.203.24:3001` |
| `APP_INTERNAL_URL` | `http://127.0.0.1:3000` |
| `DB_BIND_HOST` | `127.0.0.1` |
| `DB_PORT` | `5432` |
| `NODE_ENV` | `production`（由 service 文件隐含） |

## 目录结构

```
/data/project/
├── dist/                  # tsup 编译产物（server.js）
├── .next/                 # Next.js 构建产物
│   └── standalone/        # Next.js standalone 输出
├── node_modules/          # 依赖
├── src/                   # 源代码
├── scripts/               # 构建/校验脚本
├── supabase/migrations/   # 数据库迁移
├── docs/                  # 文档
├── data/exports/          # 导出文件存储
├── .env                   # 环境变量（本地参考）
└── docker-compose.yml     # Docker Compose 配置（备用/开发参考）
```
