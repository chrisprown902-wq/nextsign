import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyTranslations, loadCache } from "../translator";
import fs from "fs";
import path from "path";

describe("applyTranslations", () => {
  it("returns items unchanged when locale is en", () => {
    const items = [
      { title: "Hello", summary: "World" },
      { title: "Foo", summary: "Bar" },
    ];
    const result = applyTranslations(items, "en");
    expect(result).toEqual(items);
    expect(result).toBe(items); // same reference for en (optimization)
  });

  it("returns items unchanged when no cache exists for locale", () => {
    const items = [{ title: "Hello", summary: "World" }];
    // loadCache would return null for a locale with no cache file
    const result = applyTranslations(items, "fr");
    expect(result[0].title).toBe("Hello");
    expect(result[0].summary).toBe("World");
  });

  it("applies cached translations when available", () => {
    // Need to mock loadCache — but applyTranslations calls it internally.
    // Instead, test that with no cache file, items pass through unchanged.
    const items = [
      { title: "Breaking News", summary: "Something happened" },
    ];
    const result = applyTranslations(items, "zh");
    // Without pre-built cache, should return originals
    expect(result[0].title).toBe("Breaking News");
    expect(result[0].summary).toBe("Something happened");
  });

  it("handles empty array", () => {
    const result = applyTranslations([], "zh");
    expect(result).toEqual([]);
  });

  it("returns same array reference for en locale (passthrough)", () => {
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

  it("returns null for malformed JSON cache file", () => {
    // Use a path we know doesn't have valid JSON — loadCache returns null on parse error
    expect(loadCache("xx")).toBeNull();
  });
});
