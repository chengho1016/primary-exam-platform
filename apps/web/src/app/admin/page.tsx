import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/ui";
import { getAdminOverview } from "@/lib/admin/admin-repository";
import { formatPaperStatus } from "@/lib/admin/presentation";

export const metadata = { title: "Admin管理概覽" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { metrics, recentPapers, reviewQuestionCount } = await getAdminOverview();

  return (
    <AppShell activePath="/admin" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>管理概覽</h1><p>內容、會員、列印及練習數據集中管理。</p></div><ButtonLink href="/admin/papers/new">＋ 上傳新試卷</ButtonLink></header>
        <div className="admin-grid">{metrics.map((metric) => <article className={`admin-stat tone-${metric.tone}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.change}</small></article>)}</div>
        <div className="dashboard-grid">
          <section className="panel"><div className="panel-header"><h3>最近試卷</h3><Link href="/admin/papers">管理全部</Link></div><div className="attempt-list">{recentPapers.map((paper) => <div className="attempt-row" key={paper.id}><span className="attempt-icon">{paper.subject.slice(0,1)}</span><div><h4>{paper.title}</h4><p>小{paper.grade} · {paper._count.questions}題</p></div><span className={`status-dot ${paper.status === "DRAFT" ? "status-draft" : ""}`}>{formatPaperStatus(paper.status)}</span></div>)}</div></section>
          <section className="panel"><div className="panel-header"><h3>待處理工作</h3></div><div className="attempt-list"><div className="attempt-row"><span className="attempt-icon">審</span><div><h4>{reviewQuestionCount}題需要覆核</h4><p>答案或原題內容需要管理員確認</p></div><strong>{reviewQuestionCount}</strong></div><div className="attempt-row"><span className="attempt-icon">庫</span><div><h4>資料庫連線正常</h4><p>Admin現已顯示即時資料</p></div><strong>✓</strong></div><div className="attempt-row"><span className="attempt-icon">印</span><div><h4>列印異常紀錄</h4><p>最近24小時</p></div><strong>0</strong></div></div></section>
        </div>
      </div>
    </AppShell>
  );
}
