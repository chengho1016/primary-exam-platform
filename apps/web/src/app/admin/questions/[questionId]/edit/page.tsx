import { notFound } from "next/navigation";
import { updateQuestionAction } from "@/app/admin/actions";
import { AppShell } from "@/components/app-shell";
import { formatAnswerRule } from "@/lib/admin/presentation";
import { db } from "@/lib/db/prisma";

export const metadata = { title: "編輯題目" };

export default async function EditQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  const question = await db.question.findUnique({ where: { id: questionId }, include: { paper: { select: { code: true, title: true } } } });
  if (!question) notFound();

  return (
    <AppShell activePath="/admin/questions" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>編輯第 {question.number} 題</h1><p>{question.paper.code} · {question.paper.title}</p></div></header>
        <form action={updateQuestionAction} className="form-panel edit-form">
          <input name="questionId" type="hidden" value={question.id} />
          <div className="field"><label htmlFor="question-stem">題目</label><textarea defaultValue={question.stem} id="question-stem" name="stem" required rows={5} /></div>
          <div className="field-row"><div className="field"><label htmlFor="question-topic">課題</label><input defaultValue={question.topic} id="question-topic" name="topic" required /></div><div className="field"><label htmlFor="question-subtopic">子課題</label><input defaultValue={question.subtopic ?? ""} id="question-subtopic" name="subtopic" /></div></div>
          <div className="field-row"><div className="field"><label htmlFor="question-difficulty">難度</label><select defaultValue={question.difficulty} id="question-difficulty" name="difficulty"><option value="easy">基礎</option><option value="medium">標準</option><option value="hard">進階</option></select></div><div className="field"><label htmlFor="canonical-answer">標準答案</label><input defaultValue={formatAnswerRule(question.answerRule).replace("（示例）", "")} id="canonical-answer" name="canonicalAnswer" required /></div></div>
          <div className="field"><label htmlFor="question-explanation">答案解析</label><textarea defaultValue={question.explanation ?? ""} id="question-explanation" name="explanation" rows={4} /></div>
          <label className="checkbox"><input defaultChecked={question.onlineEligible} name="onlineEligible" type="checkbox" />允許抽入15題網上練習</label>
          <button className="button button-primary" type="submit">儲存並標記已覆核</button>
        </form>
      </div>
    </AppShell>
  );
}
