"use client";

import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
};

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (nextLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.replace(newPath);
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="pill-tag bg-white border border-border-cream text-sm text-olive-gray cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-wise-green/40 transition-all
        hover:bg-mint-surface"
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-tag)",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2387867f'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: "28px",
      }}
      aria-label="Switch language"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  );
}
