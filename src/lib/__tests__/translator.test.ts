import { describe, it, expect, vi } from "vitest";

// In-memory fake filesystem — hoisted so vi.mock factory can access it
const fakeFS: Record<string, string> = vi.hoisted(() => ({}));
const fsMock = vi.hoisted(() => ({
  existsSync: vi.fn((p: string) => p in fakeFS),
  readFileSync: vi.fn((p: string, _enc: string) => {
    if (p in fakeFS) return fakeFS[p];
    throw new Error("ENOENT");
  }),
  writeFileSync: vi.fn((p: string, data: string) => { fakeFS[p] = data; }),
  mkdirSync: vi.fn(() => {}),
  unlinkSync: vi.fn((p: string) => { delete fakeFS[p]; }),
}));

vi.mock("fs", () => ({ default: fsMock, ...fsMock }));

vi.mock("bing-translate-api", () => ({
  translate: vi.fn((text: string, _from: null, to: string) =>
    Promise.resolve({ translation: `[${to}] ${text}` })
  ),
}));

import { applyTranslations, loadCache, ensureTranslations } from "../translator";

describe("applyTranslations", () => {
  it("returns items unchanged when locale is en", () => {
    const items = [
      { title: "Hello", summary: "World" },
      { title: "Foo", summary: "Bar" },
    ];
    const result = applyTranslations(items, "en");
    expect(result).toEqual(items);
    expect(result).toBe(items);
  });

  it("returns items unchanged when no cache exists for locale", () => {
    const items = [{ title: "Hello", summary: "World" }];
    const result = applyTranslations(items, "fr");
    expect(result[0].title).toBe("Hello");
    expect(result[0].summary).toBe("World");
  });

  it("handles empty array", () => {
    const result = applyTranslations([], "zh");
    expect(result).toEqual([]);
  });

  it("returns same array reference for en locale", () => {
    const items = [{ title: "Test", summary: "Test summary" }];
    const result = applyTranslations(items, "en");
    expect(result).toBe(items);
  });

  it("does not mutate original items", () => {
    const items = [{ title: "Original", summary: "Original summary" }];
    applyTranslations(items, "ja");
    expect(items[0].title).toBe("Original");
    expect(items[0].summary).toBe("Original summary");
  });
});

describe("loadCache", () => {
  it("returns null for missing cache file", () => {
    const result = loadCache("nonexistent-locale-xx");
    expect(result).toBeNull();
  });
});

describe("ensureTranslations", () => {
  it("does nothing when locale is en", async () => {
    await ensureTranslations([{ title: "Hello", summary: "World" }], "en");
  });

  it("does nothing when locale is unsupported", async () => {
    await ensureTranslations([{ title: "Hello", summary: "World" }], "fr");
  });

  it("translates new items and saves to cache", async () => {
    const items = [
      { title: "Breaking News", summary: "Something happened today" },
    ];
    await ensureTranslations(items, "zh");

    const cache = loadCache("zh");
    expect(cache).not.toBeNull();
    expect(cache!.titles["Breaking News"]).toBe("[zh-Hans] Breaking News");
  });

  it("skips items already in cache", async () => {
    await ensureTranslations([{ title: "A", summary: "B" }], "zh");
    await ensureTranslations([{ title: "A", summary: "B" }], "zh");
  });

  it("handles empty array", async () => {
    await ensureTranslations([], "zh");
  });
});
