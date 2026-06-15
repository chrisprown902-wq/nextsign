import Parser from "rss-parser";

const parser = new Parser({ timeout: 10000 });

interface SourceConfig {
  name: string;
  url: string;
  weight: number;
}

const ALLOWED_DOMAINS = [
  "techcrunch.com",
  "openai.com",
  "blog.google",
  "technologyreview.com",
  "arxiv.org",
  "wired.com",
  "theverge.com",
  "venturebeat.com",
];

const sources: SourceConfig[] = [
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    weight: 80,
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    weight: 95,
  },
  {
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    weight: 90,
  },
  {
    name: "MIT Tech Review AI",
    url: "https://www.technologyreview.com/feed/",
    weight: 85,
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    weight: 75,
  },
  {
    name: "Wired AI",
    url: "https://www.wired.com/feed/tag/ai/latest/rss",
    weight: 78,
  },
];

export function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, '').trim();
}

export function getSummary(item: any): string {
  const raw = item.contentSnippet || item.summary || item['content:encoded'] || item.content || item.description;
  if (!raw) return "Read more";
  const stripped = stripHtml(raw);
  return stripped.slice(0, MAX_SUMMARY_LENGTH) || "Read more";
}

const MAX_SUMMARY_LENGTH = 200;

const categoryKeywords: Record<string, string[]> = {
  launches: [
    "发布","推出","上线","开源","模型","产品","更新",
    "GPT-","Gemini","Llama","Claude","Grok","Copilot",
    "launch","release","announce","introduces","introducing","unveil",
    "rolls out","now available","debut","open-source","open source",
    "model","update","new feature","sdk","api","beta",
  ],
  research: [
    "论文","研究","方法","算法","训练","推理","性能","基准","开源项目",
    "GitHub","arXiv",
    "paper","research","algorithm","training","inference","benchmark",
    "study","breakthrough","accuracy","performance","dataset","architecture",
    "fine-tuning","pretraining","scaling","evaluation",
  ],
  business: [
    "融资","收购","投资","合作","招聘","人事","战略","财报","市场","CEO",
    "funding","acquisition","invest","partnership","hiring","revenue",
    "valuation","raise","million","billion","IPO","earnings","strategy",
    "layoff","hire","merger","deal","round","startup","profit",
  ],
};

const categoryKeywordsLower: Record<string, string[]> = Object.fromEntries(
  Object.entries(categoryKeywords).map(([cat, kws]) => [
    cat,
    kws.map((kw) => kw.toLowerCase()),
  ])
);

export function matchCategories(title: string, summary: string): string[] {
  const text = (title + " " + summary).toLowerCase();
  const categories: string[] = ["trending"];
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (categoryKeywordsLower[cat].some((kw) => text.includes(kw))) {
      categories.push(cat);
    }
  }
  return categories;
}

export function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export interface RawArticle {
  id: string;
  title: string;
  source: string;
  summary: string;
  url: string;
  date: string;
  rawPubDate: string;
  sourceWeight: number;
  categories: string[];
}

export async function fetchAllNews(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];

  const results = await Promise.allSettled(
    sources.map(async (src) => {
      if (!isAllowedUrl(src.url)) {
        console.warn(`Skipped non-whitelisted source: ${src.name}`);
        return [];
      }
      const feed = await parser.parseURL(src.url);
      return (feed.items || []).map((item) => {
        const summary = getSummary(item);
        return {
          id: `${src.name}-${item.guid || item.link || Math.random().toString(36).slice(2)}`,
          title: item.title || "无标题",
          source: src.name,
          summary,
          url: item.link || "",
          date: item.pubDate
            ? new Date(item.pubDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          rawPubDate: item.pubDate || new Date().toISOString(),
          sourceWeight: src.weight,
          categories: matchCategories(item.title || "", summary),
        };
      });
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      console.error(`Source fetch failed: ${result.reason}`);
    }
  }

  return articles;
}
