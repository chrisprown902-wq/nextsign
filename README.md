[🇬🇧 English](README.md) | [🇨🇳 中文](README_ZH.md)

# ai-news-site

AI industry news aggregator with smart scoring, auto-categorization, and multilingual support. Built with Next.js 14, React 18, and TypeScript.

## Features

- **Multi-source aggregation** — fetches AI news from TechCrunch, OpenAI Blog, Google AI, MIT Tech Review, The Verge, and Wired via RSS
- **Heat score ranking** — ranks articles by recency (40%), source authority (30%), and engagement signals (30%)
- **Auto-categorization** — classifies articles into launches, research, business, and trending
- **i18n** — English, 中文, 日本語 UI with route-based locale switching (`next-intl`)
- **Caching** — 1-hour TTL file cache to avoid hitting RSS feeds on every request
- **Graceful degradation** — built-in demo data when all sources are unavailable
- **Auto-translation** — background Bing Translate pipeline for article summaries

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + TailwindCSS |
| Language | TypeScript |
| i18n | next-intl |
| RSS | rss-parser |
| Translation | bing-translate-api |
| Testing | Vitest |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Development
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes
│   │   ├── page.tsx       # Home page (data fetching + SSR)
│   │   ├── layout.tsx     # Locale layout
│   │   └── HomeContent.tsx
│   ├── api/news/route.ts  # News API endpoint
│   └── globals.css
├── src/
│   ├── lib/               # Pure logic (testable)
│   │   ├── newsFetcher.ts           # RSS parsing + domain whitelist
│   │   ├── heatScoreCalculator.ts   # Scoring algorithm
│   │   ├── translator.ts            # Bing Translate wrapper
│   │   └── __tests__/
│   ├── components/         # React components
│   │   ├── NewsCard.tsx
│   │   ├── NewsGrid.tsx
│   │   ├── TopThreeGrid.tsx
│   │   ├── CategoryNav.tsx
│   │   ├── LocaleSwitcher.tsx
│   │   └── AnimatedContainer.tsx
│   ├── data/demoNews.ts    # Fallback demo data
│   └── i18n/
│       ├── request.ts
│       └── routing.ts
├── messages/               # i18n locale files
│   ├── en.json
│   ├── zh.json
│   └── ja.json
├── data/                   # Runtime cache (gitignored)
└── vitest.config.ts
```

## Data Sources

| Source | Weight | Type |
|--------|--------|------|
| OpenAI Blog | 95 | RSS |
| Google AI Blog | 90 | RSS |
| MIT Tech Review | 85 | RSS |
| TechCrunch AI | 80 | RSS |
| Wired AI | 78 | RSS |
| The Verge AI | 75 | RSS |

## Heat Score Algorithm

```
Score = Recency(40%) + Source Weight(30%) + Interaction(30%)
```

- **Recency**: 100pts within 24h, halves every 24h after
- **Source Weight**: preset authority scores per source
- **Interaction**: placeholder for future real engagement data

## Caching Strategy

- Results cached to `data/news-cache.json`
- 1-hour TTL: serve cache, skip RSS fetch
- All sources fail → fallback to `demoNews.ts` static data

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CACHE_TTL` | No | `3600` | Cache TTL in seconds |
| `DEEPSEEK_API_KEY` | No | — | For AI summary generation |
| `HUGGINGFACE_API_KEY` | No | — | For AI summary generation |

## Adding New Sources

Edit `sources` array and `ALLOWED_DOMAINS` in `src/lib/newsFetcher.ts`.

## License

MIT
