import type { RawArticle } from "./newsFetcher";
import type { NewsItem } from "@/data/types";

const MAX_SUMMARY_LENGTH = 200;

function hoursSince(pubDateStr: string): number {
  const pubMs = new Date(pubDateStr).getTime();
  return (Date.now() - pubMs) / (1000 * 60 * 60);
}

function recencyScore(hoursOld: number): number {
  if (hoursOld <= 24) return 100;
  const days = hoursOld / 24;
  return Math.max(5, Math.round(100 * Math.pow(0.5, days)));
}

export function calculateHeatScores(articles: RawArticle[]): NewsItem[] {
  const scored: NewsItem[] = articles.map((a) => {
    const hoursOld = hoursSince(a.rawPubDate);
    const recency = recencyScore(hoursOld);
    const sourceWeight = a.sourceWeight;

    // Weighted score: recency 60%, source authority 40%
    let heatScore = recency * 0.6 + sourceWeight * 0.4;
    if (hoursOld < 24) heatScore += 5;

    heatScore = Math.min(100, Math.max(0, heatScore));
    heatScore = Math.round(heatScore * 10) / 10;

    return {
      id: a.id,
      title: a.title,
      source: a.source,
      summary: a.summary.slice(0, MAX_SUMMARY_LENGTH),
      url: a.url || undefined,
      heatScore,
      date: a.date,
      categories: a.categories,
    };
  });

  scored.sort((a, b) => b.heatScore - a.heatScore);
  return scored;
}
