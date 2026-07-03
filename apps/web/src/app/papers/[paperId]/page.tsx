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
              先了解試卷範圍，再選擇 15 題網上練習或防外流水印列印。第三階段把試卷詳情變成「任務簡報」，家長同小朋友更易判斷下一步。
            </p>
            <div className="paper-detail-actions-inline">
              {practiceReady ? (
                <Link className="button button-primary" href={`/practice/${paper.id}`}><SparklesIcon />開始15題練習</Link>
              ) : (
                <span className="button button-disabled">網上題目整理中</span>
              )}
              <Link className="button button-secondary" href="/papers">返回試卷庫</Link>
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
            <h3>選擇使用方式</h3>
            <p>兩種模式使用同一份題庫，但保留各自最合適的作答體驗。</p>
            <div className="action-stack action-stack-redesign">
              {practiceReady ? (
                <Link className="button button-primary" href={`/practice/${paper.id}`}><SparklesIcon />開始15題練習</Link>
              ) : (
                <span className="button button-disabled">網上題目整理中</span>
              )}
              {canPrint ? (
                <form action={createPrintJobAction}>
                  <input name="paperId" type="hidden" value={paper.id} />
                  <button className="button button-secondary button-full" type="submit"><PrinterIcon />{printMode === "source" ? "預覽來源檔並列印" : "預覽及列印"}</button>
                </form>
              ) : (
                <span className="button button-disabled">列印檔案整理中</span>
              )}
            </div>
            <div className="paper-mode-note">
              <strong>Learning OS 建議</strong>
              <span>{practiceReady ? "今日先做 15 題，錯題會自動沉澱到弱項訓練中心。" : "如果網上題未齊，先用列印模式完成紙本測驗。"}</span>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
