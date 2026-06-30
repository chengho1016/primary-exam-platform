export const siteConfig = {
  name: "小學堂",
  description: "為小一至小六學生而設的智能試卷及練習平台",
  supportEmail: "hello@example.com",
} as const;

export const grades = [1, 2, 3, 4, 5, 6] as const;

export const subjects = [
  { id: "chinese", name: "中文", shortName: "中", tone: "coral" },
  { id: "english", name: "英文", shortName: "英", tone: "blue" },
  { id: "math", name: "數學", shortName: "數", tone: "mint" },
  { id: "humanities", name: "人文", shortName: "人", tone: "sun" },
  { id: "science", name: "科學", shortName: "科", tone: "purple" },
] as const;
