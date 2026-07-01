import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { listAdminQuestions } from "@/lib/admin/admin-repository";
import { formatAnswerRule, formatQuestionType, formatReviewStatus } from "@/lib/admin/presentation";

export const metadata = { title: "題庫管理" };
export const dynamic = "force-dynamic";

type ReviewFilter = "verified" | "needs-review" | "print-only";
type AdminQuestion = Awaited<ReturnType<typeof listAdminQuestions>>[number];

const validReviewFilters = new Set<ReviewFilter>(["verified", "needs-review", "print-only"]);

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

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<{ paper?: string; topic?: string; review?: string; updated?: string; created?: string }> }) {
  const filters = await searchParams;
  const review = filters.review && validReviewFilters.has(filters.review as ReviewFilter) ? filters.review as ReviewFilter : undefined;
  const questions = await listAdminQuestions({ paperCode: filters.paper?.trim(), topic: filters.topic?.trim(), review });
  const topicOptions = buildTopicOptions(questions);
  const metrics = getMetrics(questions);

  return (
    <AppShell activePath="/admin/questions" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>題庫管理</h1>
            <p>{filters.paper ? `${filters.paper} · ` : ""}管理題幹、答案、解析、難度、覆核狀態及將來自動組卷資格。</p>
          </div>
          <div className="admin-header-actions">
            <span className="badge badge-blue">共 {questions.length} 題</span>
            <Link className="button button-primary button-small" href={`/admin/questions/new${filters.paper ? `?paper=${encodeURIComponent(filters.paper)}` : ""}`}>＋ 新增題目</Link>
          </div>
        </header>

        {filters.updated === "1" ? <p className="success-banner">題目及答案已更新。</p> : null}
        {filters.created === "1" ? <p className="success-banner">新題目已加入題庫。</p> : null}

        <section className="admin-grid admin-question-metrics" aria-label="題庫概覽">
          <div className="admin-stat tone-mint"><span>已覆核可練習</span><strong>{metrics.verified}</strong><small>可作網上練習／未來組卷基礎</small></div>
          <div className="admin-stat tone-coral"><span>需要覆核</span><strong>{metrics.needsReview}</strong><small>先檢查答案規則</small></div>
          <div className="admin-stat tone-sun"><span>只供列印</span><strong>{metrics.printOnly}</strong><small>暫不放入網上練習</small></div>
          <div className="admin-stat tone-blue"><span>課題數</span><strong>{metrics.topicCount}</strong><small>下一步可正規化成 Topic table</small></div>
        </section>

        <form className="filter-bar" method="get">
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
                      <small>{question.paper.code}</small>
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
