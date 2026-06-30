import { AppShell } from "@/components/app-shell";
import { Badge, ButtonLink } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { formatAnswerRule } from "@/lib/admin/presentation";
import { getWrongBook } from "@/lib/learning/learning-repository";

export const metadata = { title: "錯題本" };

export default async function WrongBookPage() {
  const user = await requireUser();
  const child = user.children[0];
  const { items, topicCounts } = child ? await getWrongBook(child.id) : { items: [], topicCounts: {} };
  const practicePaperId = items[0]?.question.paper.id ?? "2324-03-MA-P4";

  return (
    <AppShell activePath="/wrong-book">
      <div className="app-content">
        <header className="app-page-header"><div><h1>{child?.displayName ?? "孩子"}的錯題本</h1><p>答錯題目會自動加入；重新答對後會標記為已改善。</p></div><ButtonLink href={`/practice/${practicePaperId}`}>開始新練習</ButtonLink></header>
        <div className="wrong-grid">
          <section className="wrong-list">{items.length ? items.map((item) => <article className="wrong-item" key={item.id}><div className="wrong-item-top"><Badge tone="coral">{item.question.topic}</Badge><small style={{ color: "var(--ink-soft)" }}>{new Intl.DateTimeFormat("zh-HK").format(item.lastWrongAt)} · 錯{item.incorrectCount}次</small></div><h3>{item.question.stem}</h3><p>正確答案：<strong style={{ color: "var(--ink)" }}>{formatAnswerRule(item.question.answerRule)}</strong></p></article>) : <div className="empty-state"><h2>目前沒有錯題</h2><p>完成練習後，答錯題目會自動出現在這裡。</p></div>}</section>
          <aside className="panel"><div className="panel-header"><h3>錯題分佈</h3></div><div className="attempt-list">{Object.entries(topicCounts).map(([topic, count]) => <div className="attempt-row" key={topic}><span className="attempt-icon">{topic.slice(0,1)}</span><div><h4>{topic}</h4><p>建議優先重溫</p></div><strong>{count}題</strong></div>)}{Object.keys(topicCounts).length === 0 ? <p style={{ color: "var(--ink-soft)", fontSize: 12 }}>完成練習後會顯示分佈。</p> : null}</div></aside>
        </div>
      </div>
    </AppShell>
  );
}
