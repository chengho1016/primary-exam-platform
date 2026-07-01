import Link from "next/link";
import { notFound } from "next/navigation";
import { updateQuestionAction } from "@/app/admin/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db/prisma";

export const metadata = { title: "編輯題目" };
export const dynamic = "force-dynamic";

function answerRuleToEditableText(answerRule: unknown) {
  if (!answerRule || typeof answerRule !== "object" || Array.isArray(answerRule)) return "";
  const rule = answerRule as Record<string, unknown>;
  if (Array.isArray(rule.canonical)) return rule.canonical.join(" → ");
  if (typeof rule.canonical === "string") return rule.canonical;
  if (typeof rule.canonical_example === "string") return rule.canonical_example;
  return "";
}

function optionsToEditableText(options: unknown) {
  if (!options || typeof options !== "object" || Array.isArray(options)) return "";
  return Object.entries(options as Record<string, unknown>)
    .map(([key, value]) => `${key}. ${String(value)}`)
    .join("\n");
}

function hasSpecialAnswerRule(answerRule: unknown) {
  if (!answerRule || typeof answerRule !== "object" || Array.isArray(answerRule)) return false;
  const rule = answerRule as Record<string, unknown>;
  return Boolean(rule.validator || rule.accepted || rule.unit || rule.canonical_example);
}

export default async function EditQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  const question = await db.question.findUnique({
    where: { id: questionId },
    include: { paper: { select: { code: true, title: true, subject: true, status: true } } },
  });
  if (!question) notFound();

  const topics = await db.question.findMany({
    distinct: ["topic"],
    orderBy: { topic: "asc" },
    select: { topic: true },
  });
  const specialRule = hasSpecialAnswerRule(question.answerRule);

  return (
    <AppShell activePath="/admin/questions" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>編輯第 {question.number} 題</h1>
            <p>{question.paper.subject} · {question.paper.code} · {question.paper.title}</p>
          </div>
          <div className="admin-header-actions">
            <Badge tone={question.paper.status === "PUBLISHED" ? "mint" : "gray"}>{question.paper.status}</Badge>
            <Link className="button button-secondary button-small" href={`/admin/questions?subject=${encodeURIComponent(question.paper.subject)}&paper=${encodeURIComponent(question.paper.code)}`}>返回題庫</Link>
          </div>
        </header>

        <section className="panel admin-guidance-panel">
          <h3>完整題目資料</h3>
          <p>呢頁而家同「新增題目」用同一套欄位。改題號時會檢查同一試卷不可重複；改分數時會同步更新試卷總分。</p>
          <div className="admin-status-stack horizontal">
            <Badge tone="blue">可改題型 / 選項</Badge>
            <Badge tone="mint">儲存後標記已覆核</Badge>
            {specialRule ? <Badge tone="sun">特殊批改規則會保留</Badge> : null}
          </div>
        </section>

        <form action={updateQuestionAction} className="form-panel edit-form admin-question-form">
          <input name="questionId" type="hidden" value={question.id} />

          <div className="readonly-box">
            <strong>所屬試卷</strong>
            <span>{question.paper.code} · {question.paper.title}</span>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="number">題號</label>
              <input defaultValue={question.number} id="number" min={1} name="number" required type="number" />
            </div>
            <div className="field">
              <label htmlFor="section">分段</label>
              <input defaultValue={question.section} id="section" name="section" placeholder="例如 A / B / 應用題" required />
            </div>
            <div className="field">
              <label htmlFor="marks">分數</label>
              <input defaultValue={question.marks} id="marks" min={0} name="marks" required type="number" />
            </div>
            <div className="field">
              <label htmlFor="sourcePage">來源頁碼</label>
              <input defaultValue={question.sourcePage ?? ""} id="sourcePage" min={0} name="sourcePage" placeholder="可留空" type="number" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="type">題型</label>
              <select defaultValue={question.type} id="type" name="type" required>
                <option value="TEXT">文字題</option>
                <option value="NUMBER">數值題</option>
                <option value="MULTIPLE_CHOICE">選擇題</option>
                <option value="WORKED_RESPONSE">詳答題</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="difficulty">難度</label>
              <select defaultValue={question.difficulty} id="difficulty" name="difficulty" required>
                <option value="easy">基礎</option>
                <option value="medium">標準</option>
                <option value="hard">進階</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="stem">題目內容</label>
            <textarea defaultValue={question.stem} id="stem" name="stem" required rows={6} />
          </div>

          <div className="field">
            <label htmlFor="optionsText">選擇題選項</label>
            <textarea defaultValue={optionsToEditableText(question.options)} id="optionsText" name="optionsText" placeholder={"只在選擇題需要填，每行一個：\nA. 12cm\nB. 18cm\nC. 24cm\nD. 36cm"} rows={5} />
            <p className="field-help">如果題型改成非選擇題，儲存後會清走舊選項，避免之後抽題顯示錯誤。</p>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="canonicalAnswer">標準答案</label>
              <input defaultValue={answerRuleToEditableText(question.answerRule)} id="canonicalAnswer" name="canonicalAnswer" placeholder="例如 正方形 / 24cm / A" required />
            </div>
            <div className="field">
              <label htmlFor="topic">課題</label>
              <input defaultValue={question.topic} id="topic" list="topic-options" name="topic" placeholder="例如 分數 / 面積 / 周界" required />
              <datalist id="topic-options">
                {topics.map((topic) => <option key={topic.topic} value={topic.topic} />)}
              </datalist>
            </div>
          </div>

          <div className="field">
            <label htmlFor="subtopic">子課題</label>
            <input defaultValue={question.subtopic ?? ""} id="subtopic" name="subtopic" placeholder="例如 異分母加減 / 正方形周界，可留空" />
          </div>

          <div className="field">
            <label htmlFor="explanation">答案解析</label>
            <textarea defaultValue={question.explanation ?? ""} id="explanation" name="explanation" placeholder="可留空；之後可用嚟生成答案紙 / 詳解。" rows={4} />
          </div>

          <label className="checkbox">
            <input defaultChecked={question.onlineEligible} name="onlineEligible" type="checkbox" />
            允許放入網上練習 / 未來自動組卷池
          </label>

          <button className="button button-primary" type="submit">儲存題目</button>
        </form>
      </div>
    </AppShell>
  );
}
