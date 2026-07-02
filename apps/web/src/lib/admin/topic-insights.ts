export type TopicTone = "mint" | "blue" | "sun" | "coral" | "gray";

export type TopicInsightSource = {
  topic: string | null;
  subtopic: string | null;
  difficulty: string | null;
  onlineEligible: boolean;
  reviewStatus: string;
  paperId: string;
  paper: {
    code: string;
    title: string;
    grade: number;
    status: string;
  };
};

export type TopicInsight = {
  name: string;
  questionCount: number;
  paperCount: number;
  verifiedOnlineCount: number;
  needsReviewCount: number;
  printOnlyCount: number;
  difficultyCounts: {
    easy: number;
    medium: number;
    hard: number;
    other: number;
  };
  subtopics: Array<{ name: string; count: number }>;
  papers: Array<{ id: string; code: string; title: string; grade: number; status: string; count: number }>;
};

export type TopicReadiness = {
  label: string;
  tone: TopicTone;
  percent: number;
  shortfall: number;
};

const FULL_WORKSHEET_QUESTION_COUNT = 30;
const TRIAL_WORKSHEET_QUESTION_COUNT = 15;

export function normalizeTopicName(value: string) {
  return value
    .trim()
    .replace(/[　\t\n\r]+/g, " ")
    .replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, "$1$2")
    .replace(/\s+/g, " ");
}

function isVerifiedOnline(question: TopicInsightSource) {
  return question.onlineEligible && question.reviewStatus.startsWith("verified");
}

function toTopicName(topic: string | null) {
  const normalized = normalizeTopicName(topic ?? "");
  return normalized || "未分類";
}

function sortCounts<T extends { count: number; name?: string; code?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return (left.name ?? left.code ?? "").localeCompare(right.name ?? right.code ?? "", "zh-Hant");
  });
}

export function describeTopicReadiness(topic: TopicInsight): TopicReadiness {
  const ready = topic.verifiedOnlineCount;
  const percent = Math.min(100, Math.round((ready / FULL_WORKSHEET_QUESTION_COUNT) * 100));
  const shortfall = Math.max(0, FULL_WORKSHEET_QUESTION_COUNT - ready);

  if (ready >= FULL_WORKSHEET_QUESTION_COUNT) {
    return { label: "已足夠30題組卷", tone: "mint", percent, shortfall };
  }

  if (ready >= TRIAL_WORKSHEET_QUESTION_COUNT) {
    return { label: "可先試做15題", tone: "blue", percent, shortfall };
  }

  if (topic.needsReviewCount > 0 && ready === 0) {
    return { label: "先覆核答案", tone: "coral", percent, shortfall };
  }

  if (topic.printOnlyCount > 0 && ready === 0) {
    return { label: "只供列印", tone: "sun", percent, shortfall };
  }

  return { label: "題量未足", tone: ready > 0 ? "sun" : "gray", percent, shortfall };
}

export function buildTopicInsights(questions: TopicInsightSource[]): TopicInsight[] {
  const topicMap = new Map<string, TopicInsight>();
  const subtopicMaps = new Map<string, Map<string, number>>();
  const paperMaps = new Map<string, Map<string, TopicInsight["papers"][number]>>();

  for (const question of questions) {
    const name = toTopicName(question.topic);
    const topic = topicMap.get(name) ?? {
      name,
      questionCount: 0,
      paperCount: 0,
      verifiedOnlineCount: 0,
      needsReviewCount: 0,
      printOnlyCount: 0,
      difficultyCounts: { easy: 0, medium: 0, hard: 0, other: 0 },
      subtopics: [],
      papers: [],
    };

    topic.questionCount += 1;
    if (isVerifiedOnline(question)) topic.verifiedOnlineCount += 1;
    if (!question.onlineEligible) topic.printOnlyCount += 1;
    if (question.onlineEligible && !question.reviewStatus.startsWith("verified")) topic.needsReviewCount += 1;

    if (question.difficulty === "easy" || question.difficulty === "medium" || question.difficulty === "hard") {
      topic.difficultyCounts[question.difficulty] += 1;
    } else {
      topic.difficultyCounts.other += 1;
    }

    const subtopicName = normalizeTopicName(question.subtopic ?? "");
    if (subtopicName) {
      const subtopics = subtopicMaps.get(name) ?? new Map<string, number>();
      subtopics.set(subtopicName, (subtopics.get(subtopicName) ?? 0) + 1);
      subtopicMaps.set(name, subtopics);
    }

    const papers = paperMaps.get(name) ?? new Map<string, TopicInsight["papers"][number]>();
    const currentPaper = papers.get(question.paperId) ?? {
      id: question.paperId,
      code: question.paper.code,
      title: question.paper.title,
      grade: question.paper.grade,
      status: question.paper.status,
      count: 0,
    };
    currentPaper.count += 1;
    papers.set(question.paperId, currentPaper);
    paperMaps.set(name, papers);

    topicMap.set(name, topic);
  }

  return Array.from(topicMap.values())
    .map((topic) => {
      const subtopics = subtopicMaps.get(topic.name) ?? new Map<string, number>();
      const papers = paperMaps.get(topic.name) ?? new Map<string, TopicInsight["papers"][number]>();
      return {
        ...topic,
        paperCount: papers.size,
        subtopics: sortCounts(Array.from(subtopics.entries()).map(([name, count]) => ({ name, count }))),
        papers: sortCounts(Array.from(papers.values())),
      };
    })
    .sort((left, right) => {
      const leftReadiness = describeTopicReadiness(left);
      const rightReadiness = describeTopicReadiness(right);
      if (rightReadiness.percent !== leftReadiness.percent) return rightReadiness.percent - leftReadiness.percent;
      if (right.questionCount !== left.questionCount) return right.questionCount - left.questionCount;
      return left.name.localeCompare(right.name, "zh-Hant");
    });
}
