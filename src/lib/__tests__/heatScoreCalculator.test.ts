import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateHeatScores } from "../heatScoreCalculator";
import type { RawArticle } from "../newsFetcher";

function makeArticle(overrides: Partial<RawArticle> = {}): RawArticle {
  return {
    id: "test-1",
    title: "Test Article",
    source: "TestSource",
    summary: "A test article summary",
    url: "https://example.com/test",
    date: "2026-05-13",
    rawPubDate: new Date().toISOString(),
    sourceWeight: 80,
    categories: ["trending"],
    ...overrides,
  };
}

describe("calculateHeatScores", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an array sorted by heatScore descending", () => {
    const articles = [
      makeArticle({ id: "a", rawPubDate: new Date().toISOString() }),
      makeArticle({ id: "b", rawPubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }),
    ];
    const result = calculateHeatScores(articles);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].heatScore).toBeGreaterThanOrEqual(result[i].heatScore);
    }
  });

  it("clamps heatScore between 0 and 100", () => {
    const articles = [
      makeArticle({ id: "a", rawPubDate: new Date().toISOString(), sourceWeight: 100 }),
      makeArticle({ id: "b", rawPubDate: "2020-01-01T00:00:00Z", sourceWeight: 0 }),
    ];
    const result = calculateHeatScores(articles);
    for (const item of result) {
      expect(item.heatScore).toBeGreaterThanOrEqual(0);
      expect(item.heatScore).toBeLessThanOrEqual(100);
    }
  });

  it("gives higher scores to recent articles than old ones", () => {
    const recent = makeArticle({
      id: "recent",
      rawPubDate: new Date().toISOString(),
    });
    const old = makeArticle({
      id: "old",
      rawPubDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const result = calculateHeatScores([recent, old]);
    const recentScore = result.find((r) => r.id === "recent")!.heatScore;
    const oldScore = result.find((r) => r.id === "old")!.heatScore;
    expect(recentScore).toBeGreaterThan(oldScore);
  });

  it("truncates summary to 200 characters", () => {
    const longSummary = "x".repeat(500);
    const articles = [makeArticle({ summary: longSummary })];
    const result = calculateHeatScores(articles);
    for (const item of result) {
      expect(item.summary.length).toBeLessThanOrEqual(200);
    }
  });

  it("preserves all input fields in output", () => {
    const articles = [makeArticle()];
    const result = calculateHeatScores(articles);
    expect(result[0].id).toBe("test-1");
    expect(result[0].title).toBe("Test Article");
    expect(result[0].source).toBe("TestSource");
    expect(result[0].url).toBe("https://example.com/test");
    expect(result[0].date).toBe("2026-05-13");
  });

  it("produces heatScore as a number with at most 1 decimal", () => {
    const articles = [makeArticle()];
    const result = calculateHeatScores(articles);
    expect(typeof result[0].heatScore).toBe("number");
    const str = result[0].heatScore.toString();
    const decimalPart = str.split(".")[1];
    if (decimalPart) {
      expect(decimalPart.length).toBeLessThanOrEqual(1);
    }
  });

  it("handles empty input", () => {
    const result = calculateHeatScores([]);
    expect(result).toEqual([]);
  });

  it("handles single article", () => {
    const result = calculateHeatScores([makeArticle()]);
    expect(result).toHaveLength(1);
    expect(result[0].heatScore).toBeGreaterThan(0);
  });

  it("article within 24h gets bonus", () => {
    const justNow = makeArticle({
      id: "fresh",
      rawPubDate: new Date().toISOString(),
    });
    const exactly25h = makeArticle({
      id: "stale",
      rawPubDate: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });
    const result = calculateHeatScores([justNow, exactly25h]);
    const freshScore = result.find((r) => r.id === "fresh")!.heatScore;
    const staleScore = result.find((r) => r.id === "stale")!.heatScore;
    expect(freshScore).toBeGreaterThan(staleScore);
  });

  it("converts empty url to undefined", () => {
    const articles = [makeArticle({ url: "" })];
    const result = calculateHeatScores(articles);
    expect(result[0].url).toBeUndefined();
  });
});
