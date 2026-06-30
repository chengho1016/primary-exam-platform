const paperStatusLabels = {
  DRAFT: "草稿",
  REVIEW: "覆核中",
  PUBLISHED: "已發布",
  ARCHIVED: "已下架",
} as const;

const paperAccessLabels = {
  FREE: "免費",
  MEMBERSHIP: "月費會員",
  PURCHASE: "逐份購買",
} as const;

const questionTypeLabels = {
  MULTIPLE_CHOICE: "選擇題",
  NUMBER: "數值題",
  TEXT: "文字題",
  WORKED_RESPONSE: "詳答題",
} as const;

export function formatPaperStatus(status: keyof typeof paperStatusLabels) {
  return paperStatusLabels[status];
}

export function formatPaperAccess(access: keyof typeof paperAccessLabels, priceInCents?: number | null) {
  if (access !== "PURCHASE") return paperAccessLabels[access];
  return priceInCents ? `$${(priceInCents / 100).toFixed(0)}` : paperAccessLabels.PURCHASE;
}

export function formatQuestionType(type: keyof typeof questionTypeLabels) {
  return questionTypeLabels[type];
}

export function formatAnswerRule(answerRule: unknown) {
  if (!answerRule || typeof answerRule !== "object" || Array.isArray(answerRule)) return "待設定";

  const rule = answerRule as Record<string, unknown>;
  const canonical = rule.canonical;
  if (Array.isArray(canonical)) return canonical.join(" → ");
  if (typeof canonical === "string") return canonical;
  if (typeof rule.canonical_example === "string") return `${rule.canonical_example}（示例）`;
  return "特殊批改規則";
}

export function formatReviewStatus(reviewStatus: string, onlineEligible: boolean) {
  if (!onlineEligible) return "只供列印";
  if (reviewStatus === "verified") return "已覆核";
  if (reviewStatus.startsWith("verified")) return "已覆核・特殊規則";
  return "需覆核";
}
