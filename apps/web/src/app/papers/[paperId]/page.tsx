import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LockIcon, PrinterIcon, SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { createPrintJobAction } from "@/app/print/actions";
import { getPublishedPaperDetails } from "@/lib/papers/paper-repository";

export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await getPublishedPaperDetails(paperId);
  return { title: paper?.summary.title ?? "試卷資料" };
}

export default async function PaperDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const details = await getPublishedPaperDetails(paperId);
  if (!details) notFound();
  const { summary: paper, topics, onlineQuestionCount, canPrint, printMode } = details;
  const practiceReady = onlineQuestionCount >= 15;
  const readinessPercent = Math.min(Math.round((onlineQuestionCount / 15) * 100), 100);

  return (
    <AppShell activePath="/papers">
      <div className="app-content paper-detail-redesign-page">
        <section className="paper-detail-hero-redesign">
          <div className="paper-detail-copy">
            <div className="paper-badges">
              <Badge tone="blue">小{paper.grade}</Badge>
              <Badge tone="mint">{paper.subject}</Badge>
              <Badge tone="gray">{paper.academicYear}</Badge>
            </div>
            <p className="eyebrow">Paper Mission Brief</p>
            <h1>{paper.title}</h1>
            <p>
              先了解試卷範圍，再選擇「預覽及列印」或「線上練習」。家長可以先睇卷面，再決定列印紙本定做 15 題短練習。
            </p>
            <div className="paper-detail-actions-inline">
              {canPrint ? (
                <form action={createPrintJobAction}>
                  <input name="paperId" type="hidden" value={paper.id} />
                  <button className="button button-primary" type="submit"><PrinterIcon />預覽及列印</button>
                </form>
              ) : (
                <span className="button button-disabled">列印檔案整理中</span>
              )}
              {practiceReady ? (
                <Link className="button button-secondary" href={`/practice/${paper.id}`}><SparklesIcon />線上練習</Link>
              ) : (
                <span className="button button-disabled">網上題目整理中</span>
              )}
            </div>
          </div>

          <aside className="paper-readiness-panel">
            <div
              className="paper-readiness-ring"
              style={{ background: `conic-gradient(var(--mint) 0 ${readinessPercent}%, var(--mint-soft) ${readinessPercent}% 100%)` }}
            >
              <strong>{onlineQuestionCount}</strong>
              <span>/ 15 題</span>
            </div>
            <h2>{practiceReady ? "已可網上練習" : "等待題庫補齊"}</h2>
            <p>{practiceReady ? "已達 15 題門檻，可以直接進入沉浸式練習。" : "未達 15 題門檻時，建議先用紙本列印或等待 Admin 補題。"}</p>
            <div className="readiness-track"><span style={{ width: `${readinessPercent}%` }} /></div>
          </aside>
        </section>

        <div className="paper-detail-grid paper-detail-grid-redesign">
          <article className="paper-detail-card paper-detail-card-redesign">
            <section className="paper-meta-grid paper-meta-grid-redesign" aria-label="試卷資料">
              <div><span>題目</span><strong>{paper.questionCount}題</strong><small>完整試卷題量</small></div>
              <div><span>頁數</span><strong>{paper.pageCount || "—"}頁</strong><small>原卷／列印來源</small></div>
              <div><span>建議時間</span><strong>{paper.durationMinutes}分鐘</strong><small>家庭測驗節奏</small></div>
              <div><span>網上練習</span><strong>{onlineQuestionCount}題</strong><small>已覆核可抽題</small></div>
            </section>

            <section className="paper-journey-grid" aria-label="使用流程">
              <div><span>01</span><strong>先睇範圍</strong><small>確認年級、科目、學年同課題。</small></div>
              <div><span>02</span><strong>做 15 題</strong><small>系統抽出已覆核題目，即時批改。</small></div>
              <div><span>03</span><strong>再列印</strong><small>需要完整紙本測驗時，用會員水印列印。</small></div>
            </section>

            <section className="paper-topic-section">
              <div className="panel-header"><h3>涵蓋課題</h3><span>{topics.length || 0} 個範圍</span></div>
              {topics.length ? (
                <div className="topic-list topic-list-redesign">{topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
              ) : (
                <p className="row-muted">課題資料整理中。</p>
              )}
            </section>

            <div className="action-note paper-detail-note"><LockIcon />此試卷共有 {paper.questionCount} 題；其中 {onlineQuestionCount} 題已通過內容檢查，可供系統抽題。所有列印均會加入會員水印。</div>
          </article>

          <aside className="action-card action-card-redesign">
            <p className="eyebrow">Choose Mode</p>
            <h3>預覽列印或線上練習</h3>
            <p>家長先預覽試卷，確認合適就列印；想即時批改就用線上練習。</p>
            <div className="action-stack action-stack-redesign">
              {canPrint ? (
                <form action={createPrintJobAction}>
                  <input name="paperId" type="hidden" value={paper.id} />
                  <button className="button button-primary button-full" type="submit"><PrinterIcon />{printMode === "source" ? "預覽來源檔並列印" : "預覽及列印"}</button>
                </form>
              ) : (
                <span className="button button-disabled">列印檔案整理中</span>
              )}
              {practiceReady ? (
                <Link className="button button-secondary" href={`/practice/${paper.id}`}><SparklesIcon />線上練習</Link>
              ) : (
                <span className="button button-disabled">網上題目整理中</span>
              )}
            </div>
            <div className="paper-mode-note">
              <strong>Learning OS 建議</strong>
              <span>{practiceReady ? "如果想即時知道對錯，先做 15 題；如果想紙本測驗，先預覽再列印。" : "如果網上題未齊，先用預覽及列印模式完成紙本測驗。"}</span>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
