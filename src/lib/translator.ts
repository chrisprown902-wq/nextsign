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

/**
 * Translate items synchronously (awaited) — for first-paint critical content.
 * Uses concurrency=3 so cold start for 6 items takes ~1s instead of ~3s.
 */
export async function ensureTranslations(
  items: { title: string; summary: string }[],
  locale: string
): Promise<void> {
  if (locale === "en") return;
  const to = langMap[locale];
  if (!to) return;

  const existing = loadCache(locale);
  const titles = existing?.titles ?? {};
  const summaries = existing?.summaries ?? {};

  const needed = items.filter(
    (item) =>
      (item.title && !titles[item.title]) ||
      (item.summary && !summaries[item.summary])
  );

  if (needed.length === 0) return;

  console.log(`[translator] Ensuring ${needed.length} items → ${locale}`);

  const CONCURRENCY = 3;
  let count = 0;
  const save = () =>
    saveCache(locale, { titles, summaries, lastUpdated: new Date().toISOString() });

  for (let i = 0; i < needed.length; i += CONCURRENCY) {
    const batch = needed.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (item) => {
        if (item.title && !titles[item.title]) {
          titles[item.title] = await translateOne(item.title, to);
        }
        if (item.summary && !summaries[item.summary]) {
          summaries[item.summary] = await translateOne(item.summary, to);
        }
      })
    );
    count += batch.length;
    if (count % 12 === 0) save();
  }
  save();
  console.log(`[translator] Done — ${count} items ensured for ${locale}`);
}

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

  // Collect all uncached titles + summaries into a single work queue
  const work: { key: "title" | "summary"; text: string }[] = [];
  for (const item of items) {
    if (item.title && !titles[item.title]) work.push({ key: "title", text: item.title });
    if (item.summary && !summaries[item.summary]) work.push({ key: "summary", text: item.summary });
  }

  if (work.length === 0) return;

  console.log(`[translator] Translating ${work.length} items → ${locale}`);

  const save = () =>
    saveCache(locale, { titles, summaries, lastUpdated: new Date().toISOString() });

  // Batch with concurrency 3 for speed
  const BATCH = 3;
  for (let i = 0; i < work.length; i += BATCH) {
    const chunk = work.slice(i, i + BATCH);
    await Promise.all(
      chunk.map(async (w) => {
        const translated = await translateOne(w.text, to);
        if (w.key === "title") titles[w.text] = translated;
        else summaries[w.text] = translated;
      })
    );
    if (i % 12 === 0) save();
  }
  save();
  console.log(`[translator] Done — ${work.length} items saved for ${locale}`);
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
