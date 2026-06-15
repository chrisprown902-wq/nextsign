# NextSign 项目规则

## 测试命令
- `npm test` — 跑全部测试
- `npm run test:watch` — 开发模式
- `npm run test:coverage` — 生成覆盖率报告

## 技术栈
- Next.js 14 + React 18 + TypeScript
- TailwindCSS
- Vitest（测试框架）

## 结构约定
- `src/lib/` — 纯逻辑（可测试）
- `src/components/` — React 组件
- `app/api/` — API 路由
- `src/lib/__tests__/` — 测试文件
- `data/` — 缓存数据（不进 git）
