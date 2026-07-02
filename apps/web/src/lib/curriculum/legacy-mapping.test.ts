import { describe, expect, it } from "vitest";
import { createKnowledgePointCode, createStableCode, createTopicCode, normalizeTopicLabel, resolveLegacySubjectCode } from "./legacy-mapping";

describe("legacy curriculum mapping", () => {
  it("maps current and legacy subject strings to normalized subject codes", () => {
    expect(resolveLegacySubjectCode("數學")).toBe("math");
    expect(resolveLegacySubjectCode("數學科")).toBe("math");
    expect(resolveLegacySubjectCode("English")).toBe("english");
    expect(resolveLegacySubjectCode("中文")).toBe("chinese");
    expect(resolveLegacySubjectCode("常識")).toBe("humanities");
    expect(resolveLegacySubjectCode("科學")).toBe("science");
  });

  it("returns null for unknown subjects so admins can review them", () => {
    expect(resolveLegacySubjectCode("視覺藝術")).toBeNull();
    expect(resolveLegacySubjectCode(undefined)).toBeNull();
  });

  it("normalizes topic labels without losing Chinese meaning", () => {
    expect(normalizeTopicLabel("  分　數  ")).toBe("分數");
    expect(normalizeTopicLabel("四則   混合 計算")).toBe("四則混合計算");
  });

  it("creates stable URL-safe codes for ascii labels and hashed Chinese labels", () => {
    expect(createStableCode("topic", "Fractions Word Problems")).toBe("fractions-word-problems");
    expect(createTopicCode("分數")).toMatch(/^topic-[a-z0-9]+$/);
    expect(createTopicCode("分 數")).toBe(createTopicCode("分數"));
    expect(createKnowledgePointCode("同分母")).toMatch(/^kp-[a-z0-9]+$/);
  });
});
