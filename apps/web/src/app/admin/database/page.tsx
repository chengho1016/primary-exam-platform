import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { getAdminDatabaseOverview } from "@/lib/admin/admin-repository";
import { formatPaperStatus } from "@/lib/admin/presentation";

export const metadata = { title: "資料庫概覽" };
export const dynamic = "force-dynamic";

const subscriptionStatusLabels = {
  TRIAL: "免費試用",
  ACTIVE: "使用中",
  PAST_DUE: "付款待處理",
  CANCELLED: "已取消",
} as const;

type TopicGroup = { topic: string; _count: { _all: number } };
type RecentUser = { id: string; displayName: string; email: string; subscriptions: Array<{ status: keyof typeof subscriptionStatusLabels }>; _count: { children: number } };
type RecentPaper = { id: string; subject: string; title: string; code: string; grade: number; status: Parameters<typeof formatPaperStatus>[0]; _count: { questions: number } };
type RecentPrintJob = { id: string; createdAt: Date; status: string; user: { displayName: string; email: string }; paper: { code: string; title: string } };
type RecentAuditLog = { id: string; createdAt: Date; action: string; entityType: string; entityId: string; admin: { displayName: string; email: string } };

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-HK", { dateStyle: "short", timeStyle: "short" }).format(value);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function percent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default async function AdminDatabasePage() {
  const { counts, topicGroups, recentUsers, recentPapers, recentPrintJobs, recentAuditLogs } = await getAdminDatabaseOverview();

  const headlineMetrics = [
    { label: "會員帳戶", value: counts.totalUsers, detail: `${counts.parentUsers} 家長 · ${counts.adminUsers} 管理員`, tone: "blue" },
    { label: "試卷", value: counts.totalPapers, detail: `${counts.publishedPapers} 已發布 · ${counts.draftPapers} 草稿`, tone: "mint" },
    { label: "題目", value: counts.totalQuestions, detail: `${counts.onlineQuestions} 可練習 · ${counts.verifiedQuestions} 已覆核`, tone: "sun" },
    { label: "列印紀錄", value: counts.totalPrintJobs, detail: `${counts.printJobs24h} 筆最近24小時`, tone: "coral" },
  ] as const;

  return (
    <AppShell activePath="/admin/database" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>資料庫概覽</h1>
            <p>直接在 Admin 後台查看正式資料庫的主要數據，不需要入 Terminal 或 Neon SQL Editor。</p>
          </div>
          <span className="badge badge-blue">即時讀取</span>
        </header>

        <section className="admin-grid admin-question-metrics" aria-label="主要資料庫指標">
          {headlineMetrics.map((metric) => (
            <article className={`admin-stat tone-${metric.tone}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        <section className="form-panel admin-guidance-panel commercial-ops-panel">
          <div className="panel-header"><h3>商業化營運安全</h3><Link href="/admin/users">管理會員</Link></div>
          <div className="commercial-checklist">
            <div><strong>帳號權限</strong><span>{counts.adminUsers} 個管理員；所有新增/改密碼操作會寫入 AdminAuditLog。</span></div>
            <div><strong>資料備份</strong><span>已加入 `scripts/backup-database.sh`；正式收費前每日最少備份一次。</span></div>
            <div><strong>收費 MVP</strong><span>可先用人工開通：會員狀態 ACTIVE + 方案 ID + 列印額度。</span></div>
            <div><strong>題庫品質</strong><span>{counts.verifiedQuestions} 題已覆核；未覆核題不應放入主推練習池。</span></div>
          </div>
        </section>

        <div className="dashboard-grid database-grid">
          <section className="panel">
            <div className="panel-header"><h3>資料表狀態</h3><Link href="/admin/papers">管理試卷</Link></div>
            <div className="database-list">
              <div><span>User</span><strong>{counts.totalUsers}</strong><small>會員 / 管理員帳戶</small></div>
              <div><span>Child</span><strong>{counts.totalChildren}</strong><small>孩子檔案</small></div>
              <div><span>Subscription</span><strong>{counts.totalSubscriptions}</strong><small>{counts.activeSubscriptions} active</small></div>
              <div><span>Paper</span><strong>{counts.totalPapers}</strong><small>{counts.publishedPapers} published</small></div>
              <div><span>Question</span><strong>{counts.totalQuestions}</strong><small>{percent(counts.onlineQuestions, counts.totalQuestions)} 可練習</small></div>
              <div><span>PrintJob</span><strong>{counts.totalPrintJobs}</strong><small>{counts.printJobs24h} / 24h</small></div>
              <div><span>PaperEntitlement</span><strong>{counts.totalEntitlements}</strong><small>逐份試卷權限</small></div>
              <div><span>AdminAuditLog</span><strong>{counts.totalAuditLogs}</strong><small>後台操作記錄</small></div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h3>上傳與儲存</h3><Link href="/admin/papers/new">上傳試卷</Link></div>
            <div className="attempt-list">
              <div className="attempt-row"><span className="attempt-icon">檔</span><div><h4>{counts.uploadedSourceCount} 份 DB 上傳檔</h4><p>儲存在 Paper.sourceAssetPath 的 base64 data URI</p></div><strong>{formatBytes(counts.sourceAssetBytes)}</strong></div>
              <div className="attempt-row"><span className="attempt-icon">發</span><div><h4>試卷狀態分佈</h4><p>草稿 {counts.draftPapers} · 覆核 {counts.reviewPapers} · 已發布 {counts.publishedPapers} · 下架 {counts.archivedPapers}</p></div><strong>{counts.totalPapers}</strong></div>
              <div className="attempt-row"><span className="attempt-icon">題</span><div><h4>題庫 readiness</h4><p>{counts.verifiedQuestions} 已覆核 · {counts.onlineQuestions} 可網上練習</p></div><strong>{percent(counts.verifiedQuestions, counts.totalQuestions)}</strong></div>
            </div>
          </section>
        </div>

        <div className="dashboard-grid database-grid">
          <section className="panel">
            <div className="panel-header"><h3>課題分佈 Top 8</h3><Link href="/admin/questions">題庫管理</Link></div>
            <div className="database-list topic-list">
              {topicGroups.map((topic: TopicGroup) => (
                <div key={topic.topic || "未設定"}><span>{topic.topic || "未設定"}</span><strong>{topic._count._all}</strong><small>題目</small></div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h3>最近會員</h3><Link href="/admin/users">會員管理</Link></div>
            <div className="attempt-list">
              {recentUsers.map((user: RecentUser) => {
                const subscription = user.subscriptions[0];
                return (
                  <div className="attempt-row" key={user.id}>
                    <span className="attempt-icon">{user.displayName.slice(0, 1)}</span>
                    <div><h4>{user.displayName}</h4><p>{user.email} · {user._count.children} 個孩子</p></div>
                    <Badge tone={subscription?.status === "ACTIVE" ? "mint" : "sun"}>{subscription ? subscriptionStatusLabels[subscription.status] : "未訂閱"}</Badge>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="dashboard-grid database-grid">
          <section className="panel">
            <div className="panel-header"><h3>最近試卷</h3><Link href="/admin/papers">全部試卷</Link></div>
            <div className="attempt-list">
              {recentPapers.map((paper: RecentPaper) => (
                <div className="attempt-row" key={paper.id}>
                  <span className="attempt-icon">{paper.subject.slice(0, 1)}</span>
                  <div><h4>{paper.title}</h4><p>{paper.code} · 小{paper.grade} · {paper._count.questions} 題</p></div>
                  <Badge tone={paper.status === "PUBLISHED" ? "mint" : paper.status === "REVIEW" ? "sun" : "gray"}>{formatPaperStatus(paper.status)}</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h3>最近列印</h3></div>
            <div className="attempt-list">
              {recentPrintJobs.length ? recentPrintJobs.map((job: RecentPrintJob) => (
                <div className="attempt-row" key={job.id}>
                  <span className="attempt-icon">印</span>
                  <div><h4>{job.paper.code}</h4><p>{job.user.displayName} · {formatDateTime(job.createdAt)}</p></div>
                  <Badge tone="blue">{job.status}</Badge>
                </div>
              )) : <p className="row-muted">未有列印紀錄</p>}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-header"><h3>最近後台操作</h3><span>AdminAuditLog</span></div>
          <div className="admin-table-wrap">
            <table className="admin-table database-audit-table">
              <thead><tr><th>時間</th><th>管理員</th><th>操作</th><th>目標</th></tr></thead>
              <tbody>
                {recentAuditLogs.map((log: RecentAuditLog) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{log.admin.displayName}<br/><small>{log.admin.email}</small></td>
                    <td>{log.action}</td>
                    <td>{log.entityType}<br/><small>{log.entityId}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
