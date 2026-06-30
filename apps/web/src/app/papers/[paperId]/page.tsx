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
  const { summary: paper, topics, onlineQuestionCount, canPrint } = details;

  return (
    <AppShell activePath="/papers">
      <div className="app-content">
        <div className="paper-detail-grid">
          <article className="paper-detail-card">
            <div className="paper-badges"><Badge tone="blue">小{paper.grade}</Badge><Badge tone="mint">{paper.subject}</Badge><Badge tone="gray">{paper.academicYear}</Badge></div>
            <h1>{paper.title}</h1>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.8 }}>這份試卷可用作完整紙本測驗，亦可由系統按課題比例抽出15題進行網上練習。</p>
            <div className="paper-meta-grid"><div><span>題目</span><strong>{paper.questionCount}題</strong></div><div><span>頁數</span><strong>{paper.pageCount}頁</strong></div><div><span>建議時間</span><strong>{paper.durationMinutes}分鐘</strong></div><div><span>程度</span><strong>標準</strong></div></div>
            <h3>涵蓋課題</h3><div className="topic-list">{topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
            <div className="action-note" style={{ marginTop: 30 }}><LockIcon />此試卷共有{paper.questionCount}題；其中{onlineQuestionCount}題已通過內容檢查，可供系統抽題。</div>
          </article>
          <aside className="action-card">
            <h3>選擇使用方式</h3><p>兩種模式使用同一份題庫，但保留各自最合適的作答體驗。</p>
            <div className="action-stack">{onlineQuestionCount >= 15 ? <Link className="button button-primary" href={`/practice/${paper.id}`}><SparklesIcon />開始15題練習</Link> : <span className="button button-disabled">網上題目整理中</span>}{canPrint ? <form action={createPrintJobAction}><input name="paperId" type="hidden" value={paper.id} /><button className="button button-secondary" type="submit"><PrinterIcon />預覽及列印</button></form> : <span className="button button-disabled">列印檔案整理中</span>}</div>
            <div className="action-note"><LockIcon />列印頁會加入會員編號、日期及授權水印；不提供下載按鈕。</div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
