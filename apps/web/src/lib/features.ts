export const isOnlinePracticeEnabled = process.env.NEXT_PUBLIC_ONLINE_PRACTICE_ENABLED === "true";

export const onlinePracticeStatus = {
  enabled: isOnlinePracticeEnabled,
  pausedLabel: "紙本列印模式",
  pausedTitle: "先專注試卷預覽與水印列印",
  pausedDescription: "現階段先把揀卷、預覽、列印流程做好；線上練習準備好後再開放。",
} as const;
