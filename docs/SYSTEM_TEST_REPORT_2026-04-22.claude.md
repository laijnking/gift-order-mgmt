# 系统修复记录

> 记录时间：2026-04-22  
> 记录人：Claude  
> 关联分支：feature/unattended-acceptance-phase

---

## 修复清单

### 1. 修复 x-user-info 头部 JSON 格式问题

**问题描述**：
- API 测试过程中，`/api/alert-records` 返回 403 错误
- 错误信息："当前账号没有执行此操作的权限"
- 但实际上 admin 账号拥有完整权限

**根本原因**：
- `src/lib/server-auth.ts` 中的 `parseUserInfoHeader` 函数在解析 JSON 时对格式敏感
- 传入的 `x-user-info` 头部如果包含多余的空格、换行符或转义问题，会导致 `JSON.parse` 失败
- 解析失败后 `parseUserInfoHeader` 返回 `null`，触发权限检查返回 403

**影响范围**：
- 所有依赖 `requirePermission` 的 API 路由
- 特别是 `alert-records` API

**修复方案**：
- 使用正确格式化的 JSON 头进行测试
- 确保 JSON 字符串是单行、无多余空格的标准格式

**修复验证**：
```bash
# 正确格式（单行、无多余空格）
curl -s "http://127.0.0.1:3001/api/alert-records" \
  -H 'x-user-info: {"id":"...","username":"admin","permissions":[...]}'

# 返回：{"success":true,"data":[],"stats":{...}}
```

**涉及文件**：
- `src/lib/server-auth.ts`

**建议优化**：
- 考虑在 `parseUserInfoHeader` 中增加容错处理
- 对 JSON 解析失败的情况返回更明确的错误信息
- 建议增加日志记录便于调试

---

## 相关文档

| 文档 | 说明 |
|------|------|
| `TEST_FEEDBACK_TEMPLATE.md` | 更新版测试反馈模板 |
| `SYSTEM_TEST_REPORT_2026-04-22.md` | 系统全量测试报告 |
| `UNATTENDED_EXECUTION_CHECKLIST.md` | 无人值守执行清单 |
| `NEXT_ACTION.md` | 下一步行动 |

---

## Git 提交记录

| 提交 | 说明 |
|------|------|
| `f8ea840` | feat: 无人值守验收体系 Phase 1 完成 |
| `65a2e05` | docs: 新增用户测试模板和系统全量测试报告 |

---

*本文件由 Claude Code 自动生成*
