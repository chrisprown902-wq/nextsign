"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { NewsItem } from "@/data/demoNews";

export default function TopThreeGrid({ initialNews }: { initialNews: NewsItem[] }) {
  const t = useTranslations("news");
  const tt = useTranslations("topThree");
  const [news, setNews] = useState(initialNews);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        const newTop3 = json.data.slice(0, 3);
        const oldIds = news.map((n) => n.id).join(",");
        const newIds = newTop3.map((n: NewsItem) => n.id).join(",");
        if (oldIds !== newIds) {
          setNews(newTop3);
        }
      }
    } catch {
      // silent fail
    } finally {
      setRefreshing(false);
    }
  }, [news]);

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-2xl md:text-3xl font-medium text-ink tracking-tight">
          {tt("heading")}
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {tt("refresh")}
        </button>
      </div>

      {/* Top 3 grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {news.map((item, i) => (
          <div
            key={item.id}
            className={`card-surface p-6 md:p-8 flex flex-col
              ${mounted ? "animate-fadeUp" : "opacity-0"}`}
            style={mounted ? { animationDelay: `${i * 0.1}s` } : undefined}
          >
            {/* Source */}
            <span className="text-xs uppercase tracking-wider text-stone-gray font-medium mb-2">
              {item.source}
            </span>

            {/* Title — serif, larger */}
            <h3 className="font-serif font-bold text-ink leading-tight text-xl md:text-2xl mb-4 tracking-tight">
              {item.title}
            </h3>

            {/* Summary */}
            <p className="text-sm text-olive-gray leading-relaxed flex-1">
              {item.summary || (
                <span className="text-stone-gray italic">{t("noSummary")}</span>
              )}
            </p>

            {/* Read more */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 text-sm font-medium transition-colors inline-flex items-center gap-1 hover:gap-2"
                style={{ color: "var(--color-dark-green)" }}
              >
                {t("readMore")}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
