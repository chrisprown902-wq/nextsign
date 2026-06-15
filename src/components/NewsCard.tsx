"use client";

import { useTranslations } from "next-intl";
import type { NewsItem } from "@/data/types";

export default function NewsCard({ news }: { news: NewsItem }) {
  const t = useTranslations("news");

  // Pick a category color
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    trending: { bg: "bg-wise-green", text: "text-dark-green", border: "border-wise-green" },
    launches: { bg: "bg-wise-green", text: "text-dark-green", border: "border-wise-green" },
    research: { bg: "bg-wise-green", text: "text-dark-green", border: "border-wise-green" },
    business: { bg: "bg-wise-green", text: "text-dark-green", border: "border-wise-green" },
  };

  const primaryCategory = news.categories[0] || "trending";
  const catStyle = categoryColors[primaryCategory] || categoryColors.trending;

  return (
    <article className="card-surface p-5 flex flex-col h-full group">
      {/* Source + Tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-wider text-stone-gray font-medium">
          {news.source}
        </span>
        {news.categories.length > 0 && (
          <span
            className={`pill-tag ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}
          >
            {news.categories[0]}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-serif font-bold text-ink leading-snug mb-3 text-base md:text-lg">
        {news.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-olive-gray leading-relaxed mb-4 flex-1">
        {news.summary || (
          <span className="text-stone-gray italic">{t("noSummary")}</span>
        )}
      </p>

      {/* Read more link */}
      <div className="mt-auto pt-3 border-t border-border-cream">
        {news.url ? (
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium transition-colors inline-flex items-center gap-1 group-hover:gap-2"
            style={{ color: "var(--color-dark-green)" }}
          >
            {t("readMore")}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
