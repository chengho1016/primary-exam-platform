import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getParentReport } from "@/lib/learning/learning-repository";

export const metadata = { title: "家長報告" };

export default async function ParentPage() {
  const user = await requireUser();
  const child = user.children[0];
  const report = child ? await getParentReport(child.id) : { attempts: [], accuracy: 0, resolvedWrongCount: 0, activeWrongCount: 0, subjectTotals: {} };

  return (
    <AppShell activePath="/parent">
      <div className="app-content">
        <header className="app-page-header"><div><h1>家長學習報告</h1><p>{child?.displayName ?? "孩子"} · 小{child?.grade ?? "-"} · 最近30天</p></div><Badge tone="mint">資料已更新</Badge></header>
        <div className="parent-grid"><div className="stat-card"><span>完成練習</span><strong>{report.attempts.length}</strong><small>最近30天</small></div><div className="stat-card"><span>平均正確率</span><strong>{report.accuracy}%</strong><small>按已完成練習計算</small></div><div className="stat-card"><span>目前錯題</span><strong>{report.activeWrongCount}</strong><small>等待重新挑戰</small></div><div className="stat-card"><span>已改善錯題</span><strong>{report.resolvedWrongCount}</strong><small>重新答對的題目</small></div></div>
        <div className="report-grid">
          <section className="panel"><div className="panel-header"><h3>各科正確率</h3><span className="badge badge-blue">最近30天</span></div>{Object.keys(report.subjectTotals).length ? <div className="bar-chart">{Object.entries(report.subjectTotals).map(([subject, totals]) => { const accuracy = totals.maximum ? Math.round(totals.score / totals.maximum * 100) : 0; return <div className="bar-column" key={subject}><i style={{ height: `${Math.max(6, accuracy)}%` }} /><span>{subject} {accuracy}%</span></div>; })}</div> : <div className="empty-state"><p>完成第一次練習後會顯示科目分析。</p></div>}</section>
          <section className="panel"><div className="panel-header"><h3>最近完成</h3></div><div className="attempt-list">{report.attempts.slice(0,5).map((attempt) => <article className="attempt-row" key={attempt.id}><span className="attempt-icon">{attempt.paper.subject.slice(0,1)}</span><div><h4>{attempt.paper.title}</h4><p>{attempt.completedAt ? new Intl.DateTimeFormat("zh-HK").format(attempt.completedAt) : "進行中"}</p></div><strong>{attempt.score}/{attempt.maximumMark}</strong></article>)}{report.attempts.length === 0 ? <p style={{ color: "var(--ink-soft)", fontSize: 12 }}>暫時未有練習紀錄。</p> : null}</div></section>
        </div>
      </div>
    </AppShell>
  );
}
