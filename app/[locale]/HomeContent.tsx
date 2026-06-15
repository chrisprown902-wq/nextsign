"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { NewsItem } from "@/data/types";
import CategoryNav from "@/components/CategoryNav";
import TopThreeGrid from "@/components/TopThreeGrid";
import NewsGrid from "@/components/NewsGrid";
import LocaleSwitcher from "@/components/LocaleSwitcher";

interface Props {
  heroNews: NewsItem[];
  otherNews: NewsItem[];
  lastUpdated: string | null;
  sourceCount: number;
  locale: string;
}

function HomeContentInner({ heroNews, otherNews, lastUpdated, sourceCount, locale }: Props) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "trending";

  const allNews = [...heroNews, ...otherNews];
  const filteredGrid =
    activeCategory === "trending"
      ? otherNews.slice(0, 15)
      : allNews.filter((n) => n.categories.includes(activeCategory)).slice(0, 30);

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleString(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      {/* ── Hero ── */}
      <header className="bg-wise-green pt-16 md:pt-28 pb-28 md:pb-36 px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between">
          <div className="max-w-3xl">
            <h1
              className="font-serif text-5xl md:text-7xl font-bold leading-none text-ink tracking-tight"
            >
              {t("header.title")}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-olive-gray leading-relaxed max-w-xl">
              {t("header.subtitle")}
            </p>
          </div>
          <LocaleSwitcher locale={locale} />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <TopThreeGrid initialNews={heroNews} />

        <div className="mt-16">
          <CategoryNav />
        </div>

        {filteredGrid.length === 0 ? (
          <p className="text-center text-stone-gray mt-20 font-serif text-lg">{t("news.noNews")}</p>
        ) : (
          <section className="mt-10">
            <NewsGrid news={filteredGrid} />
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 bg-wise-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center text-sm leading-relaxed text-ink">
            {sourceCount > 0 ? (
              <p>
                {t("footer.sources", { count: sourceCount })}
                {formattedTime && (
                  <span className="opacity-60">
                    {" · "}
                    {t("footer.lastUpdated", { time: formattedTime })}
                  </span>
                )}
              </p>
            ) : (
              <p className="opacity-60">{t("footer.fetchError")}</p>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

export default function HomeContent(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-serif text-stone-gray text-lg">Loading...</p>
        </div>
      }
    >
      <HomeContentInner {...props} />
    </Suspense>
  );
}
