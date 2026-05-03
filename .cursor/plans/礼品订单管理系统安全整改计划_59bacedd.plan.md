---
name: 礼品订单管理系统安全整改计划
overview: 验证了文档中 8 个安全问题全部存在，制定分批次整改计划，优先修复 P0 级别安全漏洞。
todos:
  - id: fix-any-type
    content: "批次 A: 修复 templates/page.tsx 的 any 类型"
    status: completed
  - id: fix-auth-signature
    content: "批次 B: 实现鉴权 HMAC 签名验证"
    status: completed
  - id: fix-login-hash
    content: "批次 C: 登录引入 argon2id，删除明文路径"
    status: completed
  - id: fix-change-password-hash
    content: "批次 D: 改密接口强制哈希"
    status: completed
  - id: fix-ssrf
    content: "批次 E: fetch-url 添加 SSRF 防护"
    status: completed
  - id: add-security-tests
    content: "批次 F: 补充安全回归测试"
    status: completed
  - id: update-docs
    content: "批次 G: 同步更新产品文档"
    status: completed
isProject: false
---

# 礼品订单管理系统安全整改计划

## 验证结果：8 个问题全部存在

| 批次 | 优先级 | 问题 | 涉及文件 | 整改方案 |
|------|--------|------|----------|----------|
| A | P0 | `any` 类型导致门禁失败 | `src/app/(app)/templates/page.tsx` | 定义接口类型替换 `any` |
| B | P0 | 鉴权可伪造 (M2+M3) | `src/lib/server-auth.ts`, `src/lib/auth.tsx` | 实现 HMAC 签名验证 |
| C | P0 | 密码明文+弱哈希 (M4) | `src/app/api/auth/login/route.ts` | 引入 `argon2id`，删除明文路径 |
| D | P0 | 改密明文落库 (M5) | `src/app/api/users/change-password/route.ts` | 改密时强制哈希 |
| E | P1 | SSRF 无防护 (M6) | `src/app/api/fetch-url/route.ts` | 添加 IP/域名黑名单 |
| F | P2 | 安全用例缺失 (M7) | `scripts/` | 补充回归测试 |
| G | P2 | 文档同步 (M8) | `docs/Product/*.md` | 添加版本记录 |

---

## 批次 A（P0）：修复 `any` 类型 - 恢复门禁

**目标：** 让 `pnpm check:unattended-acceptance` 通过

**操作：**
1. 在 `src/app/(app)/templates/page.tsx` 第 337 行
2. 将 `map((m: any) =>` 改为 `map((m: unknown) =>` 并用类型守卫 narrowing

**验证：** `pnpm check:layout-acceptance`

---

## 批次 B（P0）：鉴权边界加固

**目标：** 禁止伪造 `x-user-info` header

**操作：**
1. 在 `src/lib/server-auth.ts` 新增 `verifySignature()` 函数
2. 前端 `src/lib/auth.tsx` 在构建 header 时增加 `x-user-signature: HMAC(...)` 签名
3. 服务端在校验权限前先验证签名

**签名方案（最小可行）：**
```typescript
// server-auth.ts 新增
function verifySignature(request: NextRequest): boolean {
  const signature = request.headers.get('x-user-signature');
  const userInfo = request.headers.get('x-user-info');
  const timestamp = request.headers.get('x-timestamp');
  // 1. 检查时间戳不过期（5分钟窗口）
  // 2. 用服务端密钥验证 HMAC 签名
}
```

**验证：** `pnpm check:permissions`

---

## 批次 C（P0）：密码安全 - 登录

**目标：** 删除明文比较和弱哈希路径

**操作：**
1. 在 `src/app/api/auth/login/route.ts`
2. 引入 `argon2id` 或 `bcrypt`
3. 删除 `if (storedHash === password)` 明文路径
4. 删除 `if (storedHash === sha256(password))` SHA256 路径
5. 删除内置明文密码对象

**数据迁移策略：**
- 首次登录时自动升级旧 SHA256 哈希到 argon2id
- 批量迁移脚本处理存量明文用户

**验证：** `pnpm check:api-contracts`

---

## 批次 D（P0）：密码安全 - 改密

**目标：** 改密时强制哈希

**操作：**
1. 在 `src/app/api/users/change-password/route.ts` 第 110 行
2. 改密前先对 `newPassword` 调用 `hashPassword(newPassword)`
3. 只写入哈希值到 `password_hash` 字段

**验证：** `pnpm check:unattended-acceptance`

---

## 批次 E（P1）：SSRF 防护

**目标：** 限制 `/api/fetch-url` 访问范围

**操作：**
1. 在 `src/app/api/fetch-url/route.ts`
2. 添加 URL 验证函数 `isAllowedUrl(url)`
3. 黑名单：`127.0.0.1`, `localhost`, `169.254.169.254`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
4. 仅允许 `http://` 和 `https://`
5. 限制响应大小、超时、跳转次数

**验证：** 手动测试内网地址被拒绝

---

## 批次 F（P2）：安全回归用例

**操作：**
1. 在 `scripts/` 目录新增 `validate-security-regression.ts`
2. 用例覆盖：伪造 header、密码明文、SSRF

---

## 批次 G（P2）：文档同步

**操作：**
在每个 `docs/Product/*.md` 文件末尾添加版本记录：
```
版本：vX.Y.Z | 更新日期：2026-05-03 | 更新内容：安全整改
```

---

## 验收门禁（全部通过才可发布）

1. `pnpm check:api-contracts`
2. `pnpm check:permissions`
3. `pnpm check:business-smoke`
4. `pnpm check:unattended-acceptance`
5. `/review` 代码审查
6. `/cso` 安全审计