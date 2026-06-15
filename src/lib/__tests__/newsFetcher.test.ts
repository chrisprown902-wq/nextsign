import { describe, it, expect } from "vitest";
import {
  stripHtml,
  isAllowedUrl,
  matchCategories,
  getSummary,
} from "../newsFetcher";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
  });

  it("handles nested tags", () => {
    expect(stripHtml("<div><span>text</span></div>")).toBe("text");
  });

  it("handles self-closing tags", () => {
    expect(stripHtml("text<br/>more")).toBe("textmore");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("preserves text without HTML tags", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});

describe("isAllowedUrl", () => {
  it("accepts whitelisted domain", () => {
    expect(isAllowedUrl("https://techcrunch.com/article")).toBe(true);
  });

  it("accepts subdomain of whitelisted domain", () => {
    expect(isAllowedUrl("https://sub.openai.com/page")).toBe(true);
  });

  it("rejects non-whitelisted domain", () => {
    expect(isAllowedUrl("https://evil.com/article")).toBe(false);
  });

  it("handles invalid URL gracefully", () => {
    expect(isAllowedUrl("not a url")).toBe(false);
  });

  it("accepts blog.google subdomain", () => {
    expect(isAllowedUrl("https://ai.blog.google/article")).toBe(true);
  });
});

describe("matchCategories", () => {
  it('returns at least ["trending"] for any input', () => {
    const result = matchCategories("nothing matches", "no keywords here");
    expect(result).toContain("trending");
  });

  it("detects 'launches' category from Chinese keywords", () => {
    const result = matchCategories("OpenAI 发布 新模型", "");
    expect(result).toContain("launches");
  });

  it("detects 'launches' category from English keywords", () => {
    const result = matchCategories("OpenAI launches new product", "");
    expect(result).toContain("launches");
  });

  it("detects 'research' category from keywords", () => {
    const result = matchCategories("新论文提出训练方法", "");
    expect(result).toContain("research");
  });

  it("detects 'business' category from keywords", () => {
    const result = matchCategories("Startup raises $100M in funding", "");
    expect(result).toContain("business");
  });

  it("can match multiple categories", () => {
    const result = matchCategories("OpenAI 发布新模型 research paper 获得 funding", "");
    expect(result).toContain("launches");
    expect(result).toContain("research");
    expect(result).toContain("business");
  });

  it("case-insensitive matching", () => {
    const result = matchCategories("GPT-4 LAUNCH", "");
    expect(result).toContain("launches");
  });
});

describe("getSummary", () => {
  it("extracts contentSnippet", () => {
    const item = { contentSnippet: "This is a snippet" };
    expect(getSummary(item)).toBe("This is a snippet");
  });

  it("falls back to summary field", () => {
    const item = { summary: "Fallback summary" };
    expect(getSummary(item)).toBe("Fallback summary");
  });

  it("falls back to content:encoded", () => {
    const item = { "content:encoded": "Encoded content" };
    expect(getSummary(item)).toBe("Encoded content");
  });

  it("falls back to content", () => {
    const item = { content: "Raw content" };
    expect(getSummary(item)).toBe("Raw content");
  });

  it("falls back to description", () => {
    const item = { description: "Description text" };
    expect(getSummary(item)).toBe("Description text");
  });

  it('falls through to next field when first is empty string', () => {
    const item = { contentSnippet: "", summary: "Fallback text" };
    expect(getSummary(item)).toBe("Fallback text");
  });

  it('returns "Read more" when no content field exists', () => {
    const item = {};
    expect(getSummary(item)).toBe("Read more");
  });

  it('returns "Read more" when HTML strips to empty', () => {
    const item = { contentSnippet: "<p></p>" };
    expect(getSummary(item)).toBe("Read more");
  });

  it("strips HTML from extracted content", () => {
    const item = { contentSnippet: "<p>Some <b>bold</b> text</p>" };
    expect(getSummary(item)).toBe("Some bold text");
  });

  it("truncates to 200 characters", () => {
    const longText = "a".repeat(300);
    const item = { contentSnippet: longText };
    const result = getSummary(item);
    expect(result.length).toBeLessThanOrEqual(200);
  });
});
