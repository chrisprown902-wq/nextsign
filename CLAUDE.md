# NextSign 项目规则

## 复杂度棘轮（Complexity Ratchet）
本项目启用 Garry Tan 式棘轮机制：代码质量只升不降。

### 三条铁律
1. **改代码必须跑测试** — `npm test`，不过不算完
2. **新功能/修 bug 必须配测试** — 测试定义"什么是正确"，没有测试的改动视为未完成
3. **覆盖率只能升不能降** — 基准线在 `.ratchet.json`，pre-commit hook 强制执行

### 测试命令
- `npm test` — 跑全部测试
- `npm run test:watch` — 开发模式
- `npm run test:coverage` — 生成覆盖率报告

### 技术栈
- Next.js 14 + React 18 + TypeScript
- TailwindCSS
- Vitest（测试框架）

### 结构约定
- `src/lib/` — 纯逻辑（可测试）
- `src/components/` — React 组件
- `app/api/` — API 路由
- `src/lib/__tests__/` — 测试文件
- `data/` — 缓存数据（不进 git）
