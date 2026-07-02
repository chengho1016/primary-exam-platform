import { describe, expect, it } from "vitest";
import { buildTopicInsights, describeTopicReadiness, normalizeTopicName, type TopicInsightSource } from "./topic-insights";

function question(overrides: Partial<TopicInsightSource> = {}): TopicInsightSource {
  return {
    topic: "分 數",
    subtopic: null,
    difficulty: "medium",
    onlineEligible: true,
    reviewStatus: "verified_admin",
    paperId: "paper-1",
    paper: { code: "P4-MATH", title: "四年級數學", grade: 4, status: "PUBLISHED" },
    ...overrides,
  };
}

describe("math topic insights", () => {
  it("normalizes topic names for admin rename/merge workflows", () => {
    expect(normalizeTopicName("  分　數  ")).toBe("分數");
    expect(normalizeTopicName("四則   混合 計算")).toBe("四則混合計算");
    expect(normalizeTopicName("Fractions   Word Problems")).toBe("Fractions Word Problems");
  });

  it("groups questions by normalized topic and counts readiness buckets", () => {
    const insights = buildTopicInsights([
      question({ topic: "分 數", subtopic: "同分母", difficulty: "easy" }),
      question({ topic: "分數", subtopic: "同分母", difficulty: "hard", onlineEligible: false }),
      question({ topic: "分數", subtopic: "異分母", reviewStatus: "pending" }),
      question({ topic: "周界", paperId: "paper-2", paper: { code: "P4-MATH-2", title: "四年級數學2", grade: 4, status: "DRAFT" } }),
    ]);

    const fraction = insights.find((topic) => topic.name === "分數");
    expect(fraction).toMatchObject({
      questionCount: 3,
      paperCount: 1,
      verifiedOnlineCount: 1,
      needsReviewCount: 1,
      printOnlyCount: 1,
      difficultyCounts: { easy: 1, medium: 1, hard: 1, other: 0 },
    });
    expect(fraction?.subtopics).toEqual([{ name: "同分母", count: 2 }, { name: "異分母", count: 1 }]);
  });

  it("labels topics with enough verified questions as worksheet-ready", () => {
    const insights = buildTopicInsights(Array.from({ length: 30 }, (_, index) => question({ paperId: `paper-${index % 3}`, topic: "面積" })));
    expect(describeTopicReadiness(insights[0])).toMatchObject({ label: "已足夠30題組卷", tone: "mint", percent: 100, shortfall: 0 });
  });
});
