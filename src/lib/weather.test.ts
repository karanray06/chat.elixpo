import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAIImage, getStructuredWeather, generateAISummary } from "./weather";
import type { StructuredWeather } from "./types";

describe("generateAIImage", () => {
  it("returns a pollinations image URL", () => {
    const url = generateAIImage("Partly cloudy", "test-token");
    expect(url).toContain("https://image.pollinations.ai/prompt/");
    expect(url).toContain("Partly%20cloudy");
  });

  it("includes token in query params", () => {
    const url = generateAIImage("Rain", "my-token");
    expect(url).toContain("token=my-token");
  });

  it("includes fixed dimensions", () => {
    const url = generateAIImage("Clear sky", "t");
    expect(url).toContain("width=512");
    expect(url).toContain("height=288");
  });

  it("encodes special characters in condition", () => {
    const url = generateAIImage("Thunderstorm with heavy hail", "t");
    expect(url).toContain(encodeURIComponent("Thunderstorm with heavy hail"));
  });
});

describe("getStructuredWeather", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns structured weather on success", async () => {
    const mockResponse = {
      current_weather: { temperature: 22.5, weathercode: 2, windspeed: 15 },
      daily: {
        time: [
          "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04",
          "2026-06-05", "2026-06-06", "2026-06-07",
        ],
        temperature_2m_max: [25, 26, 27, 28, 29, 30, 31],
        temperature_2m_min: [15, 16, 17, 18, 19, 20, 21],
        weathercode: [0, 1, 2, 3, 45, 51, 61],
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => mockResponse,
    } as Response);

    const result = await getStructuredWeather(40.7, -74.0, "New York");

    expect(result).not.toBeNull();
    expect(result!.location).toBe("New York");
    expect(result!.current.temperature).toBe(23); // Math.round(22.5)
    expect(result!.current.condition).toBe("Partly cloudy");
    expect(result!.current.wind_speed).toBe(15);
    expect(result!.forecast).toHaveLength(7);
    expect(result!.forecast[0].condition).toBe("Clear sky");
  });

  it("returns null on fetch error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const result = await getStructuredWeather(0, 0, "Nowhere");
    expect(result).toBeNull();
  });

  it("maps unknown weather codes to 'Unknown'", async () => {
    const mockResponse = {
      current_weather: { temperature: 10, weathercode: 999, windspeed: 5 },
      daily: {
        time: Array(7).fill("2026-06-01"),
        temperature_2m_max: Array(7).fill(20),
        temperature_2m_min: Array(7).fill(10),
        weathercode: Array(7).fill(999),
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => mockResponse,
    } as Response);

    const result = await getStructuredWeather(0, 0, "Test");
    expect(result!.current.condition).toBe("Unknown");
    expect(result!.forecast[0].condition).toBe("Unknown");
  });
});

describe("generateAISummary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sampleWeather: StructuredWeather = {
    location: "London",
    current: { datetime: "2026-06-01T12:00:00Z", temperature: 18, condition: "Overcast", wind_speed: 10 },
    forecast: [
      { day: "Monday", date: "2026-06-01", high: 20, low: 12, condition: "Overcast" },
    ],
  };

  it("returns AI-generated summary on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({
        choices: [{ message: { content: "Cloudy day in London!" } }],
      }),
    } as Response);

    const result = await generateAISummary(sampleWeather, "token-123");
    expect(result).toBe("Cloudy day in London!");
  });

  it("returns fallback when choices are empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ choices: [] }),
    } as Response);

    const result = await generateAISummary(sampleWeather, "token-123");
    expect(result).toBe("No summary available.");
  });

  it("returns unavailable message for null weather", async () => {
    const result = await generateAISummary(null as unknown as StructuredWeather, "token");
    expect(result).toBe("Weather data is unavailable.");
  });
});
