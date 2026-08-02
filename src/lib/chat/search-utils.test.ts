import { describe, it, expect } from "vitest";
import {
  searchMessages,
  getHighlightSnippet,
  highlightText,
} from "./search-utils";
import type { DisplayMessage } from "./use-chat";

function msg(id: string, role: "user" | "assistant", content: string): DisplayMessage {
  return { id, role, content };
}

describe("searchMessages", () => {
  const messages: DisplayMessage[] = [
    msg("1", "user", "Hello world, how are you?"),
    msg("2", "assistant", "I am fine, hello!"),
    msg("3", "user", "Tell me about the weather"),
    msg("4", "assistant", "The weather is great today. The weather forecast looks good."),
  ];

  it("returns empty array for empty query", () => {
    expect(searchMessages(messages, "")).toEqual([]);
    expect(searchMessages(messages, "   ")).toEqual([]);
  });

  it("finds case-insensitive matches", () => {
    const results = searchMessages(messages, "hello");
    expect(results).toHaveLength(2);
    expect(results[0].messageId).toBe("1");
    expect(results[1].messageId).toBe("2");
  });

  it("counts multiple matches per message", () => {
    const results = searchMessages(messages, "weather");
    const weatherMsg = results.find((r) => r.messageId === "4");
    expect(weatherMsg).toBeDefined();
    expect(weatherMsg!.matchCount).toBe(2);
    expect(weatherMsg!.highlights).toHaveLength(2);
  });

  it("returns no results for unmatched query", () => {
    expect(searchMessages(messages, "zzzzzz")).toEqual([]);
  });

  it("highlights have correct positions", () => {
    const results = searchMessages(messages, "hello");
    const first = results[0];
    expect(first.highlights[0]).toEqual({ start: 0, end: 5 });
  });

  it("preserves original content in result", () => {
    const results = searchMessages(messages, "hello");
    expect(results[0].content).toBe("Hello world, how are you?");
  });

  it("includes role in results", () => {
    const results = searchMessages(messages, "hello");
    expect(results[0].role).toBe("user");
    expect(results[1].role).toBe("assistant");
  });
});

describe("getHighlightSnippet", () => {
  const content = "The quick brown fox jumps over the lazy dog";

  it("extracts snippet around a highlight", () => {
    const result = getHighlightSnippet(content, { start: 10, end: 15 }, 5);
    expect(result.snippet).toBe("uick brown fox ");
    expect(result.highlightStart).toBe(5);
    expect(result.highlightEnd).toBe(10);
  });

  it("clamps to start of string", () => {
    const result = getHighlightSnippet(content, { start: 0, end: 3 }, 10);
    expect(result.snippet.startsWith("The")).toBe(true);
    expect(result.highlightStart).toBe(0);
  });

  it("clamps to end of string", () => {
    const result = getHighlightSnippet(content, { start: 40, end: 43 }, 10);
    expect(result.snippet.endsWith("dog")).toBe(true);
  });

  it("uses default context length of 50", () => {
    const short = "hi";
    const result = getHighlightSnippet(short, { start: 0, end: 2 });
    expect(result.snippet).toBe("hi");
  });
});

describe("highlightText", () => {
  it("returns original text when no highlights", () => {
    const result = highlightText("hello world", []);
    expect(result).toEqual(["hello world"]);
  });

  it("splits text around a single highlight", () => {
    const result = highlightText("hello world", [{ start: 6, end: 11 }]);
    expect(result).toEqual([
      "hello ",
      { type: "highlight", text: "world" },
    ]);
  });

  it("handles highlight at start", () => {
    const result = highlightText("hello world", [{ start: 0, end: 5 }]);
    expect(result).toEqual([
      { type: "highlight", text: "hello" },
      " world",
    ]);
  });

  it("handles multiple highlights", () => {
    const result = highlightText("aaa bbb ccc", [
      { start: 0, end: 3 },
      { start: 8, end: 11 },
    ]);
    expect(result).toEqual([
      { type: "highlight", text: "aaa" },
      " bbb ",
      { type: "highlight", text: "ccc" },
    ]);
  });

  it("handles unsorted highlights", () => {
    const result = highlightText("aaa bbb ccc", [
      { start: 8, end: 11 },
      { start: 0, end: 3 },
    ]);
    expect(result).toEqual([
      { type: "highlight", text: "aaa" },
      " bbb ",
      { type: "highlight", text: "ccc" },
    ]);
  });

  it("handles adjacent highlights", () => {
    const result = highlightText("abcd", [
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
    expect(result).toEqual([
      { type: "highlight", text: "ab" },
      { type: "highlight", text: "cd" },
    ]);
  });
});
