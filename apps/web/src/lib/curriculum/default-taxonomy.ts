export const DEFAULT_CURRICULUM = {
  code: "hk-primary",
  nameZh: "香港小學課程",
  nameEn: "Hong Kong Primary Curriculum",
  regionCode: "HK",
} as const;

export const DEFAULT_SUBJECTS = [
  { code: "chinese", nameZh: "中文", nameEn: "Chinese", shortName: "中", displayOrder: 1, tone: "coral" },
  { code: "english", nameZh: "英文", nameEn: "English", shortName: "英", displayOrder: 2, tone: "blue" },
  { code: "math", nameZh: "數學", nameEn: "Mathematics", shortName: "數", displayOrder: 3, tone: "mint" },
  { code: "humanities", nameZh: "人文", nameEn: "Humanities", shortName: "人", displayOrder: 4, tone: "sun" },
  { code: "science", nameZh: "科學", nameEn: "Science", shortName: "科", displayOrder: 5, tone: "purple" },
] as const;

export type DefaultSubjectCode = (typeof DEFAULT_SUBJECTS)[number]["code"];

export function getDefaultSubjectByCode(code: string) {
  return DEFAULT_SUBJECTS.find((subject) => subject.code === code) ?? null;
}
