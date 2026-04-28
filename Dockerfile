FROM node:20-alpine AS base

RUN apk add --no-cache bash

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Next.js builder stage
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 .env 文件（提供默认环境变量配置）
COPY --from=builder /app/.env ./.env 2>/dev/null || true

# 加载环境变量（支持 dotenv），确定导出文件目录
# 优先级：环境变量 > .env 文件 > /app/data/exports
# /app 在只读模式下为 /app，目录已通过 RUN mkdir -p /app/data/exports 创建
RUN if [ -f .env ]; then \
    set -a; \
    . ./.env; \
    set +a; \
    mkdir -p "${EXPORT_ARTIFACT_DIR:-/app/data/exports}"; \
    chown -R nextjs:nodejs /app/data 2>/dev/null || true; \
    chmod -R 755 /app/data 2>/dev/null || true; \
    fi

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
