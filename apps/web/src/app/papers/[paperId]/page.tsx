import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LockIcon, PrinterIcon, SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { createPrintJobAction } from "@/app/print/actions";
import { canAccessGrade } from "@/lib/auth/grade-access";
import { getCurrentUser } from "@/lib/auth/session";
import { isOnlinePracticeEnabled, onlinePracticeStatus } from "@/lib/features";
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
  const readinessPercent = isOnlinePracticeEnabled ? Math.min(Math.round((onlineQuestionCount / 15) * 100), 100) : 100;
  const practiceStatusCopy = isOnlinePracticeEnabled
    ? practiceReady ? "已可網上練習" : "等待題庫補齊"
    : onlinePracticeStatus.pausedTitle;
  const practiceStatusDescription = isOnlinePracticeEnabled
    ? practiceReady ? "已達 15 題門檻，可以直接進入沉浸式練習。" : "未達 15 題門檻時，建議先用紙本列印或等待 Admin 補題。"
    : onlinePracticeStatus.pausedDescription;

  const printButton = canPrint ? (
    <form action={createPrintJobAction}>
      <input name="paperId" type="hidden" value={paper.id} />
      <button className="button button-primary" type="submit"><PrinterIcon />預覽及列印</button>
    </form>
  ) : (
    <span className="button button-disabled">列印檔案整理中</span>
  );

  const renderPracticeButton = () => isOnlinePracticeEnabled
    ? practiceReady
      ? <Link className="button button-secondary" href={`/practice/${paper.id}`}><SparklesIcon />線上練習</Link>
      : <span className="button button-disabled">網上題目整理中</span>
    : <span className="button button-disabled"><SparklesIcon />{onlinePracticeStatus.pausedLabel}</span>;

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
            <p className="eyebrow">Print Mission Brief</p>
            <h1>{paper.title}</h1>
            <p>
              先預覽試卷內容，再用會員水印列印完整紙本。線上練習已暫停，之後會拆成獨立服務再重新開放。
            </p>
            <div className="paper-detail-actions-inline">
              {printButton}
              {renderPracticeButton()}
            </div>
          </div>

          <aside className="paper-readiness-panel">
            <div
              className="paper-readiness-ring"
              style={{ background: `conic-gradient(var(--mint) 0 ${readinessPercent}%, var(--mint-soft) ${readinessPercent}% 100%)` }}
            >
              {isOnlinePracticeEnabled ? <><strong>{onlineQuestionCount}</strong><span>/ 15 題</span></> : <><strong>列印</strong><span>優先</span></>}
            </div>
            <h2>{practiceStatusCopy}</h2>
            <p>{practiceStatusDescription}</p>
            <div className="readiness-track"><span style={{ width: `${readinessPercent}%` }} /></div>
          </aside>
        </section>

        <div className="paper-detail-grid paper-detail-grid-redesign">
          <article className="paper-detail-card paper-detail-card-redesign">
            <section className="paper-meta-grid paper-meta-grid-redesign" aria-label="試卷資料">
              <div><span>題目</span><strong>{paper.questionCount}題</strong><small>完整試卷題量</small></div>
              <div><span>頁數</span><strong>{paper.pageCount || "—"}頁</strong><small>原卷／列印來源</small></div>
              <div><span>建議時間</span><strong>{paper.durationMinutes}分鐘</strong><small>家庭測驗節奏</small></div>
              <div><span>列印服務</span><strong>{canPrint ? "已開放" : "整理中"}</strong><small>線上練習暫停</small></div>
            </section>

            <section className="paper-journey-grid" aria-label="使用流程">
              <div><span>01</span><strong>先預覽</strong><small>確認年級、科目、學年同課題。</small></div>
              <div><span>02</span><strong>再列印</strong><small>用會員水印輸出完整紙本試卷。</small></div>
              <div><span>03</span><strong>紙本作答</strong><small>孩子按正式測驗節奏完成，再由家長跟進。</small></div>
            </section>

            <section className="paper-topic-section">
              <div className="panel-header"><h3>涵蓋課題</h3><span>{topics.length || 0} 個範圍</span></div>
              {topics.length ? (
                <div className="topic-list topic-list-redesign">{topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
              ) : (
                <p className="row-muted">課題資料整理中。</p>
              )}
            </section>

            <div className="action-note paper-detail-note"><LockIcon />所有列印均會加入會員水印。線上練習現已暫停，避免同影印試卷流程混在一起。</div>
          </article>

          <aside className="action-card action-card-redesign">
            <p className="eyebrow">Print Mode</p>
            <h3>先專注影印試卷</h3>
            <p>家長先預覽試卷，確認合適就列印；線上練習會之後以獨立服務形式重開。</p>
            <div className="action-stack action-stack-redesign">
              {canPrint ? (
                <form action={createPrintJobAction}>
                  <input name="paperId" type="hidden" value={paper.id} />
                  <button className="button button-primary button-full" type="submit"><PrinterIcon />{printMode === "source" ? "預覽來源檔並列印" : "預覽及列印"}</button>
                </form>
              ) : (
                <span className="button button-disabled">列印檔案整理中</span>
              )}
              {renderPracticeButton()}
            </div>
            <div className="paper-mode-note">
              <strong>營運方向</strong>
              <span>影印試卷同線上練習先拆開；目前先把紙本預覽、列印、水印及權限流程做到清晰穩定。</span>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
