export const isOnlinePracticeEnabled = process.env.NEXT_PUBLIC_ONLINE_PRACTICE_ENABLED === "true";

export const onlinePracticeStatus = {
  enabled: isOnlinePracticeEnabled,
  pausedLabel: "線上練習暫停",
  pausedTitle: "線上練習稍後獨立開放",
  pausedDescription: "現階段先專注影印試卷服務；線上練習會拆成獨立服務，準備好後可再重新開啟。",
} as const;
