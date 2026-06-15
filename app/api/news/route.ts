import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/newsFetcher";
import { calculateHeatScores } from "@/lib/heatScoreCalculator";
import type { NewsItem } from "@/data/types";
import fs from "fs";
import path from "path";

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

async function refreshData(): Promise<CacheData> {
  const raw = await fetchAllNews();
  const scored = calculateHeatScores(raw);
  const cache: CacheData = {
    data: scored,
    lastUpdated: new Date().toISOString(),
    sourceCount: new Set(raw.map((a) => a.source)).size,
  };
  writeCache(cache);
  return cache;
}

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";
  const category = req.nextUrl.searchParams.get("category");

  if (refresh) {
    try {
      const cache = await refreshData();
      return NextResponse.json({ success: true, ...cache });
    } catch (e) {
      console.error("Refresh failed:", e);
      return NextResponse.json(
        { success: false, error: "Refresh failed", data: [], lastUpdated: null, sourceCount: 0 },
        { status: 500 }
      );
    }
  }

  let cacheData = readCache();
  if (!cacheData) {
    try {
      cacheData = await refreshData();
    } catch (e) {
      console.error("Initial fetch failed:", e);
      return NextResponse.json(
        { success: false, error: "No data available", data: [], lastUpdated: null, sourceCount: 0 },
        { status: 500 }
      );
    }
  } else {
    const age = Date.now() - new Date(cacheData.lastUpdated).getTime();
    if (age >= CACHE_TTL_MS) {
      refreshData().catch((e) => console.error("Background refresh failed:", e));
    }
  }

  const validCategories = ["trending", "launches", "research", "business"];
  let filtered = cacheData.data;
  if (category && validCategories.includes(category)) {
    filtered = filtered.filter((a) => a.categories.includes(category));
  }
  filtered.sort((a, b) => b.heatScore - a.heatScore);

  return NextResponse.json({
    success: true,
    data: filtered,
    lastUpdated: cacheData.lastUpdated,
    sourceCount: cacheData.sourceCount,
  });
}
