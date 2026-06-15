"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const categoryKeys = ["trending", "launches", "research", "business"] as const;

export default function CategoryNav() {
  const t = useTranslations("categories");
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") || "trending";

  const handleClick = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex justify-center gap-3 flex-wrap">
      {categoryKeys.map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => handleClick(key)}
            className={`pill-tag text-sm font-medium transition-all duration-200 cursor-pointer border
              ${isActive
                ? "bg-wise-green text-dark-green border-wise-green scale-105"
                : "bg-white text-olive-gray border-border-cream hover:bg-mint-surface hover:text-ink hover:scale-105"
              }`}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--radius-tag)",
              transform: isActive ? "scale(1.05)" : "scale(1)",
            }}
          >
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
