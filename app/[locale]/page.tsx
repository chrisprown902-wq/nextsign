import { fetchAllNews } from "@/lib/newsFetcher";
import { calculateHeatScores } from "@/lib/heatScoreCalculator";
import type { NewsItem } from "@/data/types";
import { applyTranslations, ensureTranslations, translateInBackground } from "@/lib/translator";
import HomeContent from "./HomeContent";
import { routing } from "@/i18n/routing";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_PATH = path.join(process.cwd(), "data", "news-cache.json");
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheData {
  data: NewsItem[];
  lastUpdated: string;
  sourceCount: number;
}

function readCache(): CacheData | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(data: CacheData) {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write cache:", e);
  }
}

async function getNews(): Promise<{ data: NewsItem[]; lastUpdated: string | null; sourceCount: number }> {
  const cache = readCache();
  if (cache) {
    const age = Date.now() - new Date(cache.lastUpdated).getTime();
    if (age < CACHE_TTL_MS) {
      return { data: cache.data, lastUpdated: cache.lastUpdated, sourceCount: cache.sourceCount };
    }
  }

  try {
    const raw = await fetchAllNews();
    if (raw.length > 0) {
      const scored = calculateHeatScores(raw);
      const newCache: CacheData = {
        data: scored,
        lastUpdated: new Date().toISOString(),
        sourceCount: new Set(raw.map((a) => a.source)).size,
      };
      writeCache(newCache);
      return { data: scored, lastUpdated: newCache.lastUpdated, sourceCount: newCache.sourceCount };
    }
  } catch (e) {
    console.error("Failed to fetch news:", e);
  }

  // All sources failed — return empty state, not demo data
  console.error("All news sources failed to fetch");
  return { data: [], lastUpdated: null, sourceCount: 0 };
}

type Props = {
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: Props) {
  const { locale } = params;
  const { data, lastUpdated, sourceCount } = await getNews();

  // Translate top 6 before first paint (hero + first 3 grid items)
  // Cold start: ~1s with concurrency=3. Warm cache: instant skip.
  const criticalCount = 6;
  const criticalItems = data.slice(0, criticalCount);
  await ensureTranslations(criticalItems, locale);

  // Apply translations (now all critical items are guaranteed translated)
  const translated = applyTranslations(data, locale);

  // Background-fill the rest (items 7-33) — doesn't block the response
  const bgItems = data.slice(criticalCount, 33);
  if (bgItems.length > 0) {
    setTimeout(() => translateInBackground(bgItems, locale).catch(() => {}), 0);
  }

  const heroNews = translated.slice(0, 3);
  const otherNews = translated.slice(3);

  return (
    <HomeContent
      heroNews={heroNews}
      otherNews={otherNews}
      lastUpdated={lastUpdated}
      sourceCount={sourceCount}
      locale={locale}
    />
  );
}
