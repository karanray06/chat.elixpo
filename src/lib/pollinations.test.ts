import { describe, it, expect } from "vitest";
import {
  POLLINATIONS_BASE_URL,
  DEFAULT_MODEL,
  TEXT_MODELS,
  getModelById,
} from "./pollinations";

describe("pollinations", () => {
  describe("constants", () => {
    it("exports a valid base URL", () => {
      expect(POLLINATIONS_BASE_URL).toBe("https://gen.pollinations.ai");
    });

    it("DEFAULT_MODEL is a valid model id", () => {
      expect(DEFAULT_MODEL).toBe("openai");
      expect(TEXT_MODELS.some((m) => m.id === DEFAULT_MODEL)).toBe(true);
    });

    it("TEXT_MODELS contains at least one model per tier", () => {
      const tiers = new Set(TEXT_MODELS.map((m) => m.tier));
      expect(tiers.has("FREE")).toBe(true);
      expect(tiers.has("PRO")).toBe(true);
      expect(tiers.has("MAX")).toBe(true);
    });

    it("every model has required fields", () => {
      TEXT_MODELS.forEach((m) => {
        expect(m.id).toBeTruthy();
        expect(m.name).toBeTruthy();
        expect(m.provider).toBeTruthy();
        expect(["FREE", "PRO", "MAX"]).toContain(m.tier);
        expect(m.description).toBeTruthy();
      });
    });

    it("model ids are unique", () => {
      const ids = TEXT_MODELS.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("getModelById", () => {
    it("returns the correct model for a valid id", () => {
      const model = getModelById("openai");
      expect(model).toBeDefined();
      expect(model!.id).toBe("openai");
      expect(model!.name).toBe("GPT-5 Mini");
    });

    it("returns undefined for an unknown id", () => {
      expect(getModelById("nonexistent")).toBeUndefined();
    });

    it("returns correct model for each tier", () => {
      const free = getModelById("mistral");
      expect(free?.tier).toBe("FREE");

      const pro = getModelById("claude");
      expect(pro?.tier).toBe("PRO");

      const max = getModelById("claude-large");
      expect(max?.tier).toBe("MAX");
    });
  });
});
