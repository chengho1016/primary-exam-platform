import { describe, expect, it } from "vitest";
import { DEFAULT_CURRICULUM, DEFAULT_SUBJECTS, getDefaultSubjectByCode } from "./default-taxonomy";

describe("default curriculum taxonomy", () => {
  it("uses the Hong Kong primary curriculum as the default curriculum", () => {
    expect(DEFAULT_CURRICULUM).toMatchObject({ code: "hk-primary", regionCode: "HK" });
  });

  it("keeps subject codes unique and display order stable", () => {
    const codes = DEFAULT_SUBJECTS.map((subject) => subject.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual(["chinese", "english", "math", "humanities", "science"]);
    expect(DEFAULT_SUBJECTS.map((subject) => subject.displayOrder)).toEqual([1, 2, 3, 4, 5]);
  });

  it("includes the post-常識 Hong Kong primary subject names", () => {
    expect(DEFAULT_SUBJECTS.map((subject) => subject.nameZh)).toEqual(["中文", "英文", "數學", "人文", "科學"]);
    expect(getDefaultSubjectByCode("math")?.nameZh).toBe("數學");
    expect(getDefaultSubjectByCode("general-studies")).toBeNull();
  });
});
