import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs to prevent tests from touching the real filesystem
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => { throw new Error("no cache"); }),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => { throw new Error("no cache"); }),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock("@/lib/newsFetcher", () => ({
  fetchAllNews: vi.fn(),
}));

vi.mock("@/lib/heatScoreCalculator", () => ({
  calculateHeatScores: vi.fn((articles: unknown[]) =>
    articles.map((a: any, i: number) => ({ ...a, heatScore: 90 - i * 5 }))
  ),
}));

import { GET } from "./route";
import { fetchAllNews } from "@/lib/newsFetcher";
import { NextRequest } from "next/server";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost"));
}

describe("GET /api/news", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when no cache and fetch fails", async () => {
    vi.mocked(fetchAllNews).mockRejectedValue(new Error("Network error"));

    const res = await GET(makeRequest("http://localhost/api/news"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.data).toEqual([]);
  });

  it("returns empty data on refresh failure", async () => {
    vi.mocked(fetchAllNews).mockRejectedValue(new Error("Down"));

    const res = await GET(makeRequest("http://localhost/api/news?refresh=true"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it("returns fresh data on refresh success", async () => {
    vi.mocked(fetchAllNews).mockResolvedValue([
      {
        id: "1", title: "Test", source: "Src", summary: "Sum",
        url: "https://example.com", date: "2026-06-16",
        rawPubDate: new Date().toISOString(), sourceWeight: 80,
        categories: ["trending"],
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/news?refresh=true"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.sourceCount).toBe(1);
  });

  it("filters by category", async () => {
    vi.mocked(fetchAllNews).mockResolvedValue([
      {
        id: "1", title: "Research paper", source: "Src", summary: "S",
        url: "https://example.com", date: "2026-06-16",
        rawPubDate: new Date().toISOString(), sourceWeight: 80,
        categories: ["trending", "research"],
      },
      {
        id: "2", title: "Product launch", source: "Src2", summary: "S2",
        url: "https://example.com/2", date: "2026-06-16",
        rawPubDate: new Date().toISOString(), sourceWeight: 75,
        categories: ["trending", "launches"],
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/news?category=research"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("1");
  });

  it("ignores invalid category param", async () => {
    vi.mocked(fetchAllNews).mockResolvedValue([
      {
        id: "1", title: "T", source: "S", summary: "S",
        url: "https://example.com", date: "2026-06-16",
        rawPubDate: new Date().toISOString(), sourceWeight: 80,
        categories: ["trending"],
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/news?category=invalid"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it("returns data sorted by heatScore descending", async () => {
    vi.mocked(fetchAllNews).mockResolvedValue([
      {
        id: "low", title: "Low", source: "S", summary: "S",
        url: "https://example.com", date: "2026-06-16",
        rawPubDate: "2026-01-01T00:00:00Z", sourceWeight: 10,
        categories: ["trending"],
      },
      {
        id: "high", title: "High", source: "S", summary: "S",
        url: "https://example.com", date: "2026-06-16",
        rawPubDate: new Date().toISOString(), sourceWeight: 100,
        categories: ["trending"],
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/news"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].heatScore).toBeGreaterThanOrEqual(body.data[1].heatScore);
  });
});
