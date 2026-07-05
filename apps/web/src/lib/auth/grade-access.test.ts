import { describe, expect, it } from "vitest";
import { buildAllowedGradeLabel, bypassesGradeRestriction, canAccessGrade, getAllowedGrades } from "./grade-access";

const parent = (grades: number[]) => ({ role: "PARENT", children: grades.map((grade) => ({ grade })) });
const admin = (grades: number[] = []) => ({ role: "ADMIN", children: grades.map((grade) => ({ grade })) });

describe("grade access", () => {
  it("dedupes and sorts child grades", () => {
    expect(getAllowedGrades(parent([4, 2, 4, 6]))).toEqual([2, 4, 6]);
  });

  it("restricts parent accounts to registered child grades", () => {
    const user = parent([4]);
    expect(canAccessGrade(user, 4)).toBe(true);
    expect(canAccessGrade(user, 3)).toBe(false);
    expect(canAccessGrade(user, 6)).toBe(false);
  });

  it("allows multiple child grades for the same parent account", () => {
    const user = parent([2, 4, 6]);
    expect(canAccessGrade(user, 2)).toBe(true);
    expect(canAccessGrade(user, 4)).toBe(true);
    expect(canAccessGrade(user, 6)).toBe(true);
    expect(canAccessGrade(user, 5)).toBe(false);
  });

  it("lets admin bypass grade restriction", () => {
    const user = admin([4]);
    expect(bypassesGradeRestriction(user)).toBe(true);
    expect(canAccessGrade(user, 1)).toBe(true);
    expect(canAccessGrade(user, 6)).toBe(true);
  });

  it("formats allowed grade labels", () => {
    expect(buildAllowedGradeLabel([2, 4, 6])).toBe("小2、小4、小6");
    expect(buildAllowedGradeLabel([])).toBe("未有已登記小朋友年級");
  });
});
