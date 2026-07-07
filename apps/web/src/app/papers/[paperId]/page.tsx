import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LockIcon, PrinterIcon, SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { createPrintJobAction } from "@/app/print/actions";
import { canAccessGrade } from "@/lib/auth/grade-access";
import { getCurrentUser } from "@/lib/auth/session";
import { isOnlinePracticeEnabled } from "@/lib/features";
import { getPublishedPaperDetails } from "@/lib/papers/paper-repository";

export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await getPublishedPaperDetails(paperId);
  return { title: paper?.summary.title ?? "試卷資料" };
}

export default async function PaperDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const [details, user] = await Promise.all([getPublishedPaperDetails(paperId), getCurrentUser()]);
  if (!details) notFound();
  const { summary: paper, topics, onlineQuestionCount, canPrint, printMode } = details;
  if (user && !canAccessGrade(user, paper.grade)) notFound();
  const practiceReady = isOnlinePracticeEnabled && onlineQuestionCount >= 15;

  const printButton = canPrint ? (
    <form action={createPrintJobAction}>
      <input name="paperId" type="hidden" value={paper.id} />
      <button className="button button-primary" type="submit"><PrinterIcon />預覽及列印</button>
    </form>
  ) : (
    <span className="button button-disabled">列印檔案整理中</span>
  );

  return (
    <AppShell activePath="/papers">
      <div className="app-content paper-detail-redesign-page">
        <section className="paper-detail-hero-redesign clean-paper-detail-hero">
          <div className="paper-detail-copy">
            <div className="paper-badges">
              <Badge tone="blue">小{paper.grade}</Badge>
              <Badge tone="mint">{paper.subject}</Badge>
              <Badge tone="gray">{paper.academicYear}</Badge>
            </div>
            <p className="eyebrow">試卷資料</p>
            <h1>{paper.title}</h1>
            <p>先確認內容，再列印完整紙本。</p>
            <div className="paper-detail-actions-inline">
              {printButton}
              {practiceReady ? <Link className="button button-secondary" href={`/practice/${paper.id}`}><SparklesIcon />線上練習</Link> : null}
            </div>
          </div>
        </section>

        <div className="paper-detail-grid paper-detail-grid-redesign clean-paper-detail-grid">
          <article className="paper-detail-card paper-detail-card-redesign">
            <section className="paper-meta-grid paper-meta-grid-redesign" aria-label="試卷資料">
              <div><span>題目</span><strong>{paper.questionCount}題</strong></div>
              <div><span>頁數</span><strong>{paper.pageCount || "—"}頁</strong></div>
              <div><span>建議時間</span><strong>{paper.durationMinutes}分鐘</strong></div>
              <div><span>列印</span><strong>{canPrint ? "可用" : "整理中"}</strong></div>
            </section>

            <section className="paper-journey-grid" aria-label="使用流程">
              <div><span>01</span><strong>預覽</strong><small>確認年級、科目、頁數。</small></div>
              <div><span>02</span><strong>列印</strong><small>產生會員水印版本。</small></div>
              <div><span>03</span><strong>作答</strong><small>孩子按紙本完成。</small></div>
            </section>

            <section className="paper-topic-section">
              <div className="panel-header"><h3>涵蓋課題</h3><span>{topics.length || 0} 個範圍</span></div>
              {topics.length ? (
                <div className="topic-list topic-list-redesign">{topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
              ) : (
                <p className="row-muted">課題資料整理中。</p>
              )}
            </section>

            <div className="action-note paper-detail-note"><LockIcon />列印版會加入會員水印。</div>
          </article>

          <aside className="action-card action-card-redesign clean-action-card">
            <p className="eyebrow">列印</p>
            <h3>{printMode === "source" ? "預覽來源檔" : "預覽試卷"}</h3>
            <p>確認無誤後再列印。</p>
            <div className="action-stack action-stack-redesign">
              {canPrint ? (
                <form action={createPrintJobAction}>
                  <input name="paperId" type="hidden" value={paper.id} />
                  <button className="button button-primary button-full" type="submit"><PrinterIcon />預覽及列印</button>
                </form>
              ) : (
                <span className="button button-disabled">列印檔案整理中</span>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
