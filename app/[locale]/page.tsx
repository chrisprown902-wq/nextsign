import { fetchAllNews } from "@/lib/newsFetcher";
import { calculateHeatScores } from "@/lib/heatScoreCalculator";
import type { NewsItem } from "@/data/types";
import { applyTranslations, translateInBackground } from "@/lib/translator";
import HomeContent from "./HomeContent";
import { routing } from "@/i18n/routing";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_PATH = path.join(process.cwd(), "data", "news-cache.json");
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const TOP_N = 33;
const SUPPORTED_LOCALES = ["zh", "ja"] as const;

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

/** Start background translation for all non-English locales */
function kickOffTranslations(items: NewsItem[]) {
  const top = items.slice(0, TOP_N);
  for (const loc of SUPPORTED_LOCALES) {
    translateInBackground(top, loc).catch((e) =>
      console.error(`[translator] bg error for ${loc}:`, e)
    );
  }
}

async function getNews(): Promise<{ data: NewsItem[]; lastUpdated: string | null; sourceCount: number }> {
  const cache = readCache();
  if (cache) {
    const age = Date.now() - new Date(cache.lastUpdated).getTime();
    if (age < CACHE_TTL_MS) {
      // Translations may not be ready yet for fresh cache — fire if needed
      kickOffTranslations(cache.data);
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

      // Translate at fetch time — articles ready in cache before any page render
      kickOffTranslations(scored);

      return { data: scored, lastUpdated: newCache.lastUpdated, sourceCount: newCache.sourceCount };
    }
  } catch (e) {
    console.error("Failed to fetch news:", e);
  }

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

  // Instant — reads from translation cache populated by kickOffTranslations
  const translated = applyTranslations(data, locale);

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
