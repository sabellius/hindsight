import { describe, it, expect } from "vitest";
import {
  millisecondsToSeconds,
  secondsToMilliseconds,
  formatUtcDateString,
  parseUtcDateTimeToSeconds,
} from "@/lib/time";

describe("millisecondsToSeconds", () => {
  it("converts ms to seconds flooring", () => {
    expect(millisecondsToSeconds(1500)).toBe(1);
  });

  it("returns 0 for 0", () => {
    expect(millisecondsToSeconds(0)).toBe(0);
  });

  it("floors partial seconds", () => {
    expect(millisecondsToSeconds(999)).toBe(0);
    expect(millisecondsToSeconds(1000)).toBe(1);
  });
});

describe("secondsToMilliseconds", () => {
  it("converts seconds to ms", () => {
    expect(secondsToMilliseconds(5)).toBe(5000);
  });

  it("returns 0 for 0", () => {
    expect(secondsToMilliseconds(0)).toBe(0);
  });
});

describe("formatUtcDateString", () => {
  it("formats UTC date from epoch seconds", () => {
    const result = formatUtcDateString(1704067200);
    expect(result).toBe("2024-01-01 00:00:00");
  });

  it("pads single digit months/days/hours", () => {
    const result = formatUtcDateString(1693526400);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe("parseUtcDateTimeToSeconds", () => {
  it("parses datetime string to epoch seconds", () => {
    const result = parseUtcDateTimeToSeconds("2024-01-01 00:00:00");
    expect(result).toBe(1704067200);
  });

  it("roundtrips with formatUtcDateString", () => {
    const original = 1704067200;
    const formatted = formatUtcDateString(original);
    const parsed = parseUtcDateTimeToSeconds(formatted);
    expect(parsed).toBe(original);
  });
});
