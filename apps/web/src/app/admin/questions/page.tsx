import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { listAdminQuestions } from "@/lib/admin/admin-repository";
import { formatAnswerRule, formatQuestionType, formatReviewStatus } from "@/lib/admin/presentation";

export const metadata = { title: "題庫管理" };
export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<{ paper?: string; updated?: string }> }) {
  const filters = await searchParams;
  const { paper } = filters;
  const questions = await listAdminQuestions(paper);

  return (
    <AppShell activePath="/admin/questions" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>題庫管理</h1><p>{paper ? `${paper} · ` : ""}管理題幹、答案、解析、難度及網上抽題資格。</p></div><span className="badge badge-blue">共 {questions.length} 題</span></header>
        {filters.updated === "1" ? <p className="success-banner">題目及答案已更新。</p> : null}
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>試卷／題號</th><th>題目</th><th>課題</th><th>題型</th><th>答案</th><th>狀態</th><th>操作</th></tr></thead><tbody>{questions.map((question) => { const status = formatReviewStatus(question.reviewStatus, question.onlineEligible); return <tr key={question.id}><td><small>{question.paper.code}</small><br/><strong>Q{question.number}</strong></td><td className="question-stem-cell">{question.stem}</td><td><Badge tone="blue">{question.topic}</Badge></td><td>{formatQuestionType(question.type)}</td><td>{formatAnswerRule(question.answerRule)}</td><td><Badge tone={status.includes("需覆核") ? "coral" : status.includes("列印") ? "sun" : "mint"}>{status}</Badge></td><td><div className="row-actions"><Link href={`/admin/questions/${question.id}/edit`}>編輯</Link></div></td></tr>; })}</tbody></table></div>
      </div>
    </AppShell>
  );
}
import Link from "next/link";
