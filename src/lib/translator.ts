import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

interface LocaleCache {
  titles: Record<string, string>;
  summaries: Record<string, string>;
  lastUpdated: string;
}

function cachePath(locale: string): string {
  return path.join(DATA_DIR, `translations-${locale}.json`);
}

export function loadCache(locale: string): LocaleCache | null {
  try {
    const p = cachePath(locale);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function saveCache(locale: string, cache: LocaleCache) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(cachePath(locale), JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("[translator] Failed to save cache:", e);
  }
}

async function translateOne(text: string, to: string): Promise<string> {
  if (!text) return text;
  try {
    const { translate } = await import("bing-translate-api");
    const r = await translate(text, null, to);
    return r?.translation ?? text;
  } catch {
    return text;
  }
}

const langMap: Record<string, string> = { zh: "zh-Hans", ja: "ja" };

export async function translateInBackground(
  items: { title: string; summary: string }[],
  locale: string
) {
  if (locale === "en") return;
  const to = langMap[locale];
  if (!to) return;

  const existing = loadCache(locale);
  const titles = existing?.titles ?? {};
  const summaries = existing?.summaries ?? {};

  const newTitles = items.filter((n) => n.title && !titles[n.title]);
  const newSummaries = items.filter((n) => n.summary && !summaries[n.summary]);

  if (newTitles.length === 0 && newSummaries.length === 0) return;

  console.log(`[translator] Translating ${newTitles.length} titles + ${newSummaries.length} summaries → ${locale}`);

  // Save cache after each item so partial results survive restarts
  const save = () => saveCache(locale, { titles, summaries, lastUpdated: new Date().toISOString() });

  let count = 0;
  for (const item of newTitles) {
    titles[item.title] = await translateOne(item.title, to);
    count++;
    if (count % 5 === 0) save();
  }
  for (const item of newSummaries) {
    summaries[item.summary] = await translateOne(item.summary, to);
    count++;
    if (count % 5 === 0) save();
  }
  save();
  console.log(`[translator] Done — ${count} translations saved for ${locale}`);
}

export function applyTranslations<T extends { title: string; summary: string }>(
  items: T[],
  locale: string
): T[] {
  if (locale === "en") return items;
  const cache = loadCache(locale);
  if (!cache) return items;

  return items.map((item) => ({
    ...item,
    title: cache.titles[item.title] || item.title,
    summary: cache.summaries[item.summary] || item.summary,
  }));
}
