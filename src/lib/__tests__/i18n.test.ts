import { describe, it, expect } from "vitest";
import { routing } from "@/i18n/routing";
import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");

function loadJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n routing", () => {
  it("supports en, zh, ja", () => {
    expect(routing.locales).toEqual(["en", "zh", "ja"]);
  });

  it("default locale is en", () => {
    expect(routing.defaultLocale).toBe("en");
  });
});

describe("i18n messages completeness", () => {
  it("all supported locales have message files", () => {
    for (const locale of routing.locales) {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      expect(fs.existsSync(filePath), `Missing messages file: ${locale}.json`).toBe(true);
    }
  });

  it("all locales have the same set of translation keys", () => {
    const keySets: Record<string, string[]> = {};
    for (const locale of routing.locales) {
      const messages = loadJson(path.join(MESSAGES_DIR, `${locale}.json`));
      keySets[locale] = getAllKeys(messages).sort();
    }

    const [base, ...others] = Object.values(keySets);
    for (const other of others) {
      expect(other).toEqual(base);
    }
  });

  it("no translation value is empty", () => {
    for (const locale of routing.locales) {
      const messages = loadJson(path.join(MESSAGES_DIR, `${locale}.json`));
      const keys = getAllKeys(messages);
      for (const key of keys) {
        const parts = key.split(".");
        let value: unknown = messages;
        for (const part of parts) {
          value = (value as Record<string, unknown>)[part];
        }
        expect(value, `Key "${key}" in ${locale}.json is empty`).toBeTruthy();
      }
    }
  });

  it("placeholder variables are consistent across locales", () => {
    // footer.sources uses {count}, footer.lastUpdated uses {time}
    const en = loadJson(path.join(MESSAGES_DIR, "en.json"));
    const zh = loadJson(path.join(MESSAGES_DIR, "zh.json"));
    const ja = loadJson(path.join(MESSAGES_DIR, "ja.json"));

    const hasPlaceholder = (s: string, name: string) => s.includes(`{${name}}`);

    expect(hasPlaceholder(en.footer.sources, "count")).toBe(true);
    expect(hasPlaceholder(zh.footer.sources, "count")).toBe(true);
    expect(hasPlaceholder(ja.footer.sources, "count")).toBe(true);

    expect(hasPlaceholder(en.footer.lastUpdated, "time")).toBe(true);
    expect(hasPlaceholder(zh.footer.lastUpdated, "time")).toBe(true);
    expect(hasPlaceholder(ja.footer.lastUpdated, "time")).toBe(true);
  });
});
