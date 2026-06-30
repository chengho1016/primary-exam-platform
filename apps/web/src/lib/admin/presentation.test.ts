import { describe, expect, it } from "vitest";
import { formatAnswerRule, formatPaperAccess, formatReviewStatus } from "./presentation";

describe("admin presentation", () => {
  it("formats canonical answer arrays in their required order", () => {
    expect(formatAnswerRule({ canonical: ["2 3/7", "15/7", "6/3"] })).toBe("2 3/7 → 15/7 → 6/3");
  });

  it("marks offline-only questions clearly", () => {
    expect(formatReviewStatus("verified", false)).toBe("只供列印");
  });

  it("formats purchase prices from cents", () => {
    expect(formatPaperAccess("PURCHASE", 1800)).toBe("$18");
  });
});
