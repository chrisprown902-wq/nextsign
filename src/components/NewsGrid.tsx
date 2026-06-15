"use client";

import type { NewsItem } from "@/data/types";
import NewsCard from "./NewsCard";
import AnimatedContainer from "./AnimatedContainer";

export default function NewsGrid({ news }: { news: NewsItem[] }) {
  return (
    <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {news.map((item) => (
        <div key={item.id} className="h-full">
          <NewsCard news={item} />
        </div>
      ))}
    </AnimatedContainer>
  );
}
