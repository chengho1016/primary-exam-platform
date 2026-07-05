export type GradeAccessUser = {
  role: string;
  children: Array<{ grade: number }>;
};

export function getAllowedGrades(user: GradeAccessUser) {
  return Array.from(new Set(user.children.map((child) => child.grade)))
    .filter((grade) => Number.isInteger(grade) && grade >= 1 && grade <= 6)
    .sort((a, b) => a - b);
}

export function bypassesGradeRestriction(user: GradeAccessUser) {
  return user.role === "ADMIN";
}

export function isGradeRestrictedUser(user: GradeAccessUser) {
  return !bypassesGradeRestriction(user);
}

export function canAccessGrade(user: GradeAccessUser, grade: number) {
  if (bypassesGradeRestriction(user)) return true;
  return getAllowedGrades(user).includes(grade);
}

export function buildAllowedGradeLabel(allowedGrades: number[]) {
  if (!allowedGrades.length) return "未有已登記小朋友年級";
  return allowedGrades.map((grade) => `小${grade}`).join("、");
}
