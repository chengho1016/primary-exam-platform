import Link from "next/link";
import { createQuestionAction } from "@/app/admin/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db/prisma";

export const metadata = { title: "新增題目" };
export const dynamic = "force-dynamic";

type PaperOption = Awaited<ReturnType<typeof getPaperOptions>>[number];

async function getPaperOptions() {
  return db.paper.findMany({
    orderBy: [{ updatedAt: "desc" }, { code: "asc" }],
    include: {
      _count: { select: { questions: true } },
      questions: { orderBy: { number: "desc" }, take: 1, select: { number: true } },
    },
  });
}

function getDefaultPaper(papers: PaperOption[], paperCode?: string) {
  if (!papers.length) return null;
  if (!paperCode) return papers[0];
  return papers.find((paper) => paper.code === paperCode || paper.id === paperCode) ?? papers[0];
}

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ paper?: string }> }) {
  const filters = await searchParams;
  const papers = await getPaperOptions();
  const defaultPaper = getDefaultPaper(papers, filters.paper);
  const nextNumber = (defaultPaper?.questions[0]?.number ?? defaultPaper?._count.questions ?? 0) + 1;
  const topics = await db.question.findMany({
    distinct: ["topic"],
    orderBy: { topic: "asc" },
    select: { topic: true },
  });

  return (
    <AppShell activePath="/admin/questions" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>新增題目</h1>
            <p>逐條建立題目，先用現有 topic 文字欄位；之後再升級成正式 Topic table。</p>
          </div>
          <Link className="button button-secondary button-small" href="/admin/questions">返回題庫</Link>
        </header>

        <section className="panel admin-guidance-panel">
          <h3>第一版規則</h3>
          <p>呢個功能係為「題庫化」打地基：先逐條入題、標課題、標答案同難度。之後先做多課題、批量匯入、隨機組卷。</p>
          <div className="admin-status-stack horizontal">
            <Badge tone="mint">會寫入 AdminAuditLog</Badge>
            <Badge tone="blue">可即時出現在題庫管理</Badge>
            <Badge tone="sun">同一試卷題號不可重複</Badge>
          </div>
        </section>

        <form action={createQuestionAction} className="form-panel edit-form admin-question-form">
          <div className="field-row">
            <div className="field">
              <label htmlFor="paperId">所屬試卷</label>
              <select defaultValue={defaultPaper?.id} id="paperId" name="paperId" required>
                {papers.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.code} · {paper.title} · {paper._count.questions} 題
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="number">題號</label>
              <input defaultValue={nextNumber} id="number" min={1} name="number" required type="number" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="section">分段</label>
              <input defaultValue="A" id="section" name="section" placeholder="例如 A / B / 應用題" required />
            </div>
            <div className="field">
              <label htmlFor="marks">分數</label>
              <input defaultValue={1} id="marks" min={0} name="marks" required type="number" />
            </div>
            <div className="field">
              <label htmlFor="sourcePage">來源頁碼</label>
              <input defaultValue="" id="sourcePage" min={0} name="sourcePage" placeholder="可留空" type="number" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="type">題型</label>
              <select defaultValue="TEXT" id="type" name="type" required>
                <option value="TEXT">文字題</option>
                <option value="NUMBER">數值題</option>
                <option value="MULTIPLE_CHOICE">選擇題</option>
                <option value="WORKED_RESPONSE">詳答題</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="difficulty">難度</label>
              <select defaultValue="medium" id="difficulty" name="difficulty" required>
                <option value="easy">基礎</option>
                <option value="medium">標準</option>
                <option value="hard">進階</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="stem">題目內容</label>
            <textarea id="stem" name="stem" placeholder="例如：一個正方形邊長 6cm，求它的周界。" required rows={6} />
          </div>

          <div className="field">
            <label htmlFor="optionsText">選擇題選項</label>
            <textarea id="optionsText" name="optionsText" placeholder={"只在選擇題需要填，每行一個：\nA. 12cm\nB. 18cm\nC. 24cm\nD. 36cm"} rows={5} />
            <p className="field-help">如果題型不是選擇題，呢格可以留空。選擇題標準答案可填 A / B / C / D。</p>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="canonicalAnswer">標準答案</label>
              <input id="canonicalAnswer" name="canonicalAnswer" placeholder="例如 正方形 / 24cm / A" required />
            </div>
            <div className="field">
              <label htmlFor="topic">課題</label>
              <input id="topic" list="topic-options" name="topic" placeholder="例如 分數 / 面積 / 周界" required />
              <datalist id="topic-options">
                {topics.map((topic) => <option key={topic.topic} value={topic.topic} />)}
              </datalist>
            </div>
          </div>

          <div className="field">
            <label htmlFor="subtopic">子課題</label>
            <input id="subtopic" name="subtopic" placeholder="例如 異分母加減 / 正方形周界，可留空" />
          </div>

          <div className="field">
            <label htmlFor="explanation">答案解析</label>
            <textarea id="explanation" name="explanation" placeholder="可留空；之後可用嚟生成答案紙 / 詳解。" rows={4} />
          </div>

          <label className="checkbox">
            <input defaultChecked name="onlineEligible" type="checkbox" />
            允許放入網上練習 / 未來自動組卷池
          </label>

          <button className="button button-primary" type="submit">新增題目</button>
        </form>
      </div>
    </AppShell>
  );
}
