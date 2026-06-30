import { describe, expect, it } from "vitest";
import { gradeAnswer } from "./grading";

describe("practice answer grading", () => {
  it("accepts a multiple-choice option label", () => {
    expect(gradeAnswer({ canonical: "C", accepted: ["C"] }, "圖C", { C: "圖C" })).toBe(true);
  });

  it("accepts a mixed number inside a dynamic range", () => {
    expect(gradeAnswer({ validator: { greater_than: "5", less_than: "6" } }, "5 1/4")).toBe(true);
  });

  it("accepts an answer with its unit", () => {
    expect(gradeAnswer({ canonical: "430", accepted: ["430"], unit: "米" }, "430米")).toBe(true);
  });
});
