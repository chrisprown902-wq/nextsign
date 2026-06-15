[🇬🇧 English](README.md) | [🇨🇳 中文](README_ZH.md)

# NextSign

AI 行业新闻聚合站 — 多源抓取、智能评分、自动分类、多语言。基于 Next.js 14 + React 18 + TypeScript。

## 功能

- **多源聚合** — 从 TechCrunch、OpenAI Blog、Google AI、MIT Tech Review、The Verge、Wired 六个 RSS 源抓取 AI 新闻
- **热度评分** — 按时效性(60%)、来源权重(40%) 加权排序
- **自动分类** — 将文章归入 launches（发布）、research（研究）、business（商业）、trending（趋势）四个类别
- **国际化** — 支持 English / 中文 / 日本語，基于路由的语种切换（`next-intl`）
- **缓存策略** — 1 小时 TTL 文件缓存，避免每次请求都拉 RSS
- **优雅降级** — 所有源不可用时展示明确错误状态，提示用户稍后重试
- **自动翻译** — 后台 Bing Translate 管道翻译文章摘要

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| UI | React 18 + TailwindCSS |
| 语言 | TypeScript |
| 国际化 | next-intl |
| RSS 解析 | rss-parser |
| 翻译 | bing-translate-api |
| 测试 | Vitest |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local

# 开发模式
npm run dev

# 运行测试
npm test

# 生产构建
npm run build
npm start
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── [locale]/          # 本地化路由
│   │   ├── page.tsx       # 首页（数据获取 + SSR）
│   │   ├── layout.tsx     # 语种布局
│   │   └── HomeContent.tsx
│   ├── api/news/route.ts  # 新闻 API 端点
│   └── globals.css
├── src/
│   ├── lib/               # 纯逻辑（可测试）
│   │   ├── newsFetcher.ts           # RSS 抓取 + 域名白名单
│   │   ├── heatScoreCalculator.ts   # 热度评分算法
│   │   ├── translator.ts            # Bing Translate 封装
│   │   └── __tests__/
│   ├── components/         # React 组件
│   │   ├── NewsCard.tsx
│   │   ├── NewsGrid.tsx
│   │   ├── TopThreeGrid.tsx
│   │   ├── CategoryNav.tsx
│   │   ├── LocaleSwitcher.tsx
│   │   └── AnimatedContainer.tsx
│   ├── data/types.ts       # 共享类型定义
│   └── i18n/
│       ├── request.ts
│       └── routing.ts
├── messages/               # i18n 翻译文件
│   ├── en.json
│   ├── zh.json
│   └── ja.json
├── data/                   # 运行时缓存（gitignore）
└── vitest.config.ts
```

## 数据源

| 来源 | 权重 | 类型 |
|------|------|------|
| OpenAI Blog | 95 | RSS |
| Google AI Blog | 90 | RSS |
| MIT Tech Review | 85 | RSS |
| TechCrunch AI | 80 | RSS |
| Wired AI | 78 | RSS |
| The Verge AI | 75 | RSS |

## 热度评分算法

```
分数 = 时效性(60%) + 来源权重(40%)
```

- **时效性**：24 小时内满分，每过 24 小时衰减 50%
- **来源权重**：基于来源权威度预设分值

## 缓存策略

- 抓取结果缓存至 `data/news-cache.json`
- 1 小时内直接返回缓存，不走 RSS 请求
- 所有源失败 → 返回错误状态，提示用户稍后重试

## 环境变量

| 变量 | 必须 | 默认值 | 说明 |
|------|------|--------|------|
| `CACHE_TTL` | 否 | `3600` | 缓存有效期（秒） |

## 添加新数据源

编辑 `src/lib/newsFetcher.ts` 中的 `sources` 数组和 `ALLOWED_DOMAINS` 白名单。

## License

MIT
