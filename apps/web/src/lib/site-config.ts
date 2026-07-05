import { DEFAULT_SUBJECTS } from "@/lib/curriculum/default-taxonomy";

export const siteConfig = {
  name: "考試吧 Exam Go",
  description: "為小一至小六學生而設的智能試卷練習及列印平台",
  supportEmail: "chenghokonghk@gmail.com",
} as const;

export const grades = [1, 2, 3, 4, 5, 6] as const;

export const subjects = DEFAULT_SUBJECTS.map((subject) => ({
  id: subject.code,
  name: subject.nameZh,
  shortName: subject.shortName,
  tone: subject.tone,
}));
