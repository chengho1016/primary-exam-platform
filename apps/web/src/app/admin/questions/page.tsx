import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { getAdminQuestionSubjectStats, listAdminQuestions } from "@/lib/admin/admin-repository";
import { formatAnswerRule, formatQuestionType, formatReviewStatus } from "@/lib/admin/presentation";

export const metadata = { title: "題庫管理" };
export const dynamic = "force-dynamic";

type ReviewFilter = "verified" | "needs-review" | "print-only";
type SubjectFilter = "all" | "數學" | "中文" | "英文" | "人文" | "科學";
type AdminQuestion = Awaited<ReturnType<typeof listAdminQuestions>>[number];

const validReviewFilters = new Set<ReviewFilter>(["verified", "needs-review", "print-only"]);
const subjectTabs: Array<{ value: SubjectFilter; label: string; scope: string }> = [
  { value: "數學", label: "數學", scope: "先集中做好課題組卷" },
  { value: "中文", label: "中文", scope: "暫維持試卷管理" },
  { value: "英文", label: "英文", scope: "暫維持試卷管理" },
  { value: "人文", label: "人文", scope: "暫維持試卷管理" },
  { value: "科學", label: "科學", scope: "暫維持試卷管理" },
  { value: "all", label: "全部", scope: "跨科檢視" },
];
const validSubjectFilters = new Set<SubjectFilter>(subjectTabs.map((tab) => tab.value));

function getReviewTone(question: AdminQuestion) {
  if (!question.onlineEligible) return "sun" as const;
  if (question.reviewStatus.startsWith("verified")) return "mint" as const;
  return "coral" as const;
}

function getWorksheetReadiness(question: AdminQuestion) {
  if (!question.onlineEligible) return { label: "不適合網上／組卷", tone: "gray" as const };
  if (!question.reviewStatus.startsWith("verified")) return { label: "待覆核答案", tone: "coral" as const };
  if (!question.topic || !question.difficulty) return { label: "待補課題／難度", tone: "sun" as const };
  return { label: "可入題庫池", tone: "mint" as const };
}

function buildTopicOptions(questions: AdminQuestion[]) {
  return Array.from(new Set(questions.map((question) => question.topic).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function getMetrics(questions: AdminQuestion[]) {
  const verified = questions.filter((question) => question.onlineEligible && question.reviewStatus.startsWith("verified")).length;
  const needsReview = questions.filter((question) => question.onlineEligible && !question.reviewStatus.startsWith("verified")).length;
  const printOnly = questions.filter((question) => !question.onlineEligible).length;
  const topicCount = new Set(questions.map((question) => question.topic).filter(Boolean)).size;

  return { verified, needsReview, printOnly, topicCount };
}

function buildQuestionsHref(subject: SubjectFilter, filters: { paper?: string; topic?: string; review?: string }) {
  const params = new URLSearchParams();
  params.set("subject", subject);
  if (filters.paper) params.set("paper", filters.paper);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.review) params.set("review", filters.review);
  return `/admin/questions?${params.toString()}`;
}

function statForSubject(stats: Awaited<ReturnType<typeof getAdminQuestionSubjectStats>>, subject: SubjectFilter) {
  if (subject === "all") {
    return stats.reduce((total, item) => ({ subject: "all", paperCount: total.paperCount + item.paperCount, questionCount: total.questionCount + item.questionCount }), { subject: "all", paperCount: 0, questionCount: 0 });
  }
  return stats.find((item) => item.subject === subject) ?? { subject, paperCount: 0, questionCount: 0 };
}

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<{ paper?: string; subject?: string; topic?: string; review?: string; updated?: string; created?: string }> }) {
  const filters = await searchParams;
  const review = filters.review && validReviewFilters.has(filters.review as ReviewFilter) ? filters.review as ReviewFilter : undefined;
  const selectedSubject = filters.subject && validSubjectFilters.has(filters.subject as SubjectFilter) ? filters.subject as SubjectFilter : "數學";
  const subjectFilter = selectedSubject === "all" ? undefined : selectedSubject;
  const [questions, subjectStats] = await Promise.all([
    listAdminQuestions({ paperCode: filters.paper?.trim(), subject: subjectFilter, topic: filters.topic?.trim(), review }),
    getAdminQuestionSubjectStats(),
  ]);
  const topicOptions = buildTopicOptions(questions);
  const metrics = getMetrics(questions);
  const selectedSubjectLabel = subjectTabs.find((tab) => tab.value === selectedSubject)?.label ?? "數學";

  return (
    <AppShell activePath="/admin/questions" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>題庫管理</h1>
            <p>{filters.paper ? `${filters.paper} · ` : ""}{selectedSubject === "all" ? "全部科目" : `${selectedSubjectLabel}科`}題庫；數學會優先支援課題組卷，其他科目暫維持試卷管理。</p>
          </div>
          <div className="admin-header-actions">
            <span className="badge badge-blue">{selectedSubject === "all" ? "全部" : selectedSubjectLabel} · 共 {questions.length} 題</span>
            <Link className="button button-primary button-small" href={`/admin/questions/new?subject=${encodeURIComponent(selectedSubject)}${filters.paper ? `&paper=${encodeURIComponent(filters.paper)}` : ""}`}>＋ 新增題目</Link>
          </div>
        </header>

        {filters.updated === "1" ? <p className="success-banner">題目及答案已更新。</p> : null}
        {filters.created === "1" ? <p className="success-banner">新題目已加入題庫。</p> : null}

        <section className="admin-subject-tabs" aria-label="科目分類">
          {subjectTabs.map((tab) => {
            const stats = statForSubject(subjectStats, tab.value);
            const active = tab.value === selectedSubject;
            return (
              <Link className={`admin-subject-tab ${active ? "active" : ""}`} href={buildQuestionsHref(tab.value, filters)} key={tab.value}>
                <strong>{tab.label}</strong>
                <span>{stats.questionCount} 題 · {stats.paperCount} 份卷</span>
                <small>{tab.scope}</small>
              </Link>
            );
          })}
        </section>

        <section className="admin-grid admin-question-metrics" aria-label="題庫概覽">
          <div className="admin-stat tone-mint"><span>已覆核可練習</span><strong>{metrics.verified}</strong><small>可作網上練習／未來組卷基礎</small></div>
          <div className="admin-stat tone-coral"><span>需要覆核</span><strong>{metrics.needsReview}</strong><small>先檢查答案規則</small></div>
          <div className="admin-stat tone-sun"><span>只供列印</span><strong>{metrics.printOnly}</strong><small>暫不放入網上練習</small></div>
          <div className="admin-stat tone-blue"><span>課題數</span><strong>{metrics.topicCount}</strong><small>下一步可正規化成 Topic table</small></div>
        </section>

        <form className="filter-bar" method="get">
          <input name="subject" type="hidden" value={selectedSubject} />
          <div className="field">
            <label htmlFor="paper-filter">試卷編號</label>
            <input defaultValue={filters.paper} id="paper-filter" name="paper" placeholder="例如 2324-03-MA-P4" />
          </div>
          <div className="field">
            <label htmlFor="topic-filter">課題</label>
            <input defaultValue={filters.topic} id="topic-filter" list="topic-options" name="topic" placeholder="例如 面積、分數" />
            <datalist id="topic-options">
              {topicOptions.map((topic) => <option key={topic} value={topic} />)}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="review-filter">覆核狀態</label>
            <select defaultValue={review ?? ""} id="review-filter" name="review">
              <option value="">全部狀態</option>
              <option value="verified">已覆核可練習</option>
              <option value="needs-review">需要覆核</option>
              <option value="print-only">只供列印</option>
            </select>
          </div>
          <button className="button button-secondary button-small" type="submit">篩選</button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table admin-question-table">
            <thead>
              <tr>
                <th>來源</th>
                <th>題目</th>
                <th>課題／難度</th>
                <th>題型</th>
                <th>答案</th>
                <th>覆核</th>
                <th>組卷準備</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => {
                const status = formatReviewStatus(question.reviewStatus, question.onlineEligible);
                const readiness = getWorksheetReadiness(question);

                return (
                  <tr id={`question-${question.id}`} key={question.id}>
                    <td className="admin-source-cell">
                      <small>{question.paper.subject} · {question.paper.code}</small>
                      <strong>Q{question.number}</strong>
                      <span>{question.paper.status}</span>
                    </td>
                    <td className="question-stem-cell">{question.stem}</td>
                    <td>
                      <div className="admin-status-stack">
                        <Badge tone="blue">{question.topic || "未設定課題"}</Badge>
                        {question.subtopic ? <Badge tone="gray">{question.subtopic}</Badge> : null}
                        <Badge tone="sun">{question.difficulty || "未設定難度"}</Badge>
                      </div>
                    </td>
                    <td>{formatQuestionType(question.type)}</td>
                    <td className="admin-answer-cell">{formatAnswerRule(question.answerRule)}</td>
                    <td><Badge tone={getReviewTone(question)}>{status}</Badge></td>
                    <td><Badge tone={readiness.tone}>{readiness.label}</Badge></td>
                    <td><div className="row-actions"><Link href={`/admin/questions/${question.id}/edit`}>編輯</Link></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
