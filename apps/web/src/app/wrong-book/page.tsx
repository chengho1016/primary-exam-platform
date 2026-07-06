import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge, ButtonLink } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { isOnlinePracticeEnabled, onlinePracticeStatus } from "@/lib/features";
import { formatAnswerRule } from "@/lib/admin/presentation";
import { getRecommendedPracticePaper, getWrongBook } from "@/lib/learning/learning-repository";

export const metadata = { title: "錯題本" };

export default async function WrongBookPage() {
  const user = await requireUser();
  const child = user.children[0];

  if (!isOnlinePracticeEnabled) {
    return (
      <AppShell activePath="/papers">
        <div className="app-content wrong-book-redesign-page">
          <header className="app-page-header wrong-book-header">
            <div>
              <p className="eyebrow">線上練習服務</p>
              <h1>{onlinePracticeStatus.pausedTitle}</h1>
              <p>{onlinePracticeStatus.pausedDescription}</p>
            </div>
            <ButtonLink href="/papers">前往影印試卷庫</ButtonLink>
          </header>
          <section className="wrong-hero-card">
            <div>
              <span>目前方向</span>
              <strong>先把影印試卷、水印、權限流程做好</strong>
              <p>錯題本會跟線上練習一齊保留，等服務重新開放後再繼續使用。</p>
            </div>
            <Link className="button button-primary" href="/papers">瀏覽及列印試卷</Link>
          </section>
        </div>
      </AppShell>
    );
  }

  const { items, topicCounts } = child ? await getWrongBook(child.id) : { items: [], topicCounts: {} };
  const recommendedPaper = await getRecommendedPracticePaper(child?.grade);
  const practiceHref = items[0]?.question.paper.id
    ? `/practice/${items[0].question.paper.id}`
    : recommendedPaper
      ? `/practice/${recommendedPaper.id}`
      : child
        ? `/papers?grade=${child.grade}&subject=math`
        : "/papers?subject=math";
  const priorityTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  const topTopic = priorityTopics[0];
  const totalWrong = items.reduce((sum, item) => sum + item.incorrectCount, 0);

  return (
    <AppShell activePath="/wrong-book">
      <div className="app-content wrong-book-redesign-page">
        <header className="app-page-header wrong-book-header">
          <div>
            <p className="eyebrow">Weakness Training Center</p>
            <h1>{child?.displayName ?? "孩子"}的弱項訓練中心</h1>
            <p>錯題會自動沉澱成課題清單；下次練習先處理最高頻弱項，再回到完整 15 題任務。</p>
          </div>
          <ButtonLink href={practiceHref}>開始針對練習</ButtonLink>
        </header>

        <section className="wrong-hero-card">
          <div>
            <span>今日修正目標</span>
            <strong>{items.length ? `先處理 ${topTopic?.[0] ?? "最高頻課題"}` : "完成一回合練習建立錯題庫"}</strong>
            <p>{items.length ? "先重看答案與解析，再回到同一份試卷做一組短練習。" : "暫時沒有錯題，代表最近練習狀態健康；可以繼續做新試卷維持節奏。"}</p>
          </div>
          <Link className="button button-primary" href={practiceHref}>開始訓練</Link>
        </section>

        <section className="admin-grid wrong-metrics" aria-label="錯題概覽">
          <div className="admin-stat tone-coral"><span>待改善錯題</span><strong>{items.length}</strong><small>目前未標記改善</small></div>
          <div className="admin-stat tone-sun"><span>累計答錯</span><strong>{totalWrong}</strong><small>包含重複出錯次數</small></div>
          <div className="admin-stat tone-blue"><span>弱項課題</span><strong>{priorityTopics.length}</strong><small>按課題聚合</small></div>
          <div className="admin-stat tone-mint"><span>優先處理</span><strong>{topTopic?.[0]?.slice(0, 4) ?? "—"}</strong><small>{topTopic ? `${topTopic[1]} 題集中改善` : "暫無弱項"}</small></div>
        </section>

        <div className="wrong-grid wrong-grid-redesign">
          <section className="wrong-list wrong-list-redesign">
            {items.length ? items.map((item, index) => (
              <article className="wrong-item wrong-item-redesign" key={item.id}>
                <div className="wrong-item-top">
                  <div className="wrong-rank">#{index + 1}</div>
                  <div>
                    <Badge tone="coral">{item.question.topic}</Badge>
                    {item.question.subtopic ? <Badge tone="gray">{item.question.subtopic}</Badge> : null}
                  </div>
                  <small>{new Intl.DateTimeFormat("zh-HK").format(item.lastWrongAt)} · 錯 {item.incorrectCount} 次</small>
                </div>
                <h3>{item.question.stem}</h3>
                <div className="wrong-answer-box">
                  <span>正確答案</span>
                  <strong>{formatAnswerRule(item.question.answerRule)}</strong>
                </div>
                <Link className="card-link" href={`/practice/${item.question.paper.id}`}>用同一份卷再練一次 →</Link>
              </article>
            )) : (
              <div className="empty-state upgraded-empty-state">
                <span>🌱</span>
                <h2>目前沒有錯題</h2>
                <p>完成練習後，答錯題目會自動出現在這裡，方便下次集中處理。</p>
                <div className="empty-actions"><ButtonLink href={practiceHref}>開始新練習</ButtonLink></div>
              </div>
            )}
          </section>

          <aside className="panel wrong-priority-panel">
            <div className="panel-header"><h3>弱項分佈</h3><span>{priorityTopics.length} 個課題</span></div>
            <div className="attempt-list wrong-topic-list">
              {priorityTopics.map(([topic, count], index) => (
                <div className="attempt-row" key={topic}>
                  <span className="attempt-icon">{index + 1}</span>
                  <div><h4>{topic}</h4><p>{index === 0 ? "建議優先重溫" : "完成首要弱項後再處理"}</p></div>
                  <strong>{count}題</strong>
                </div>
              ))}
              {priorityTopics.length === 0 ? <p className="row-muted">完成練習後會顯示分佈。</p> : null}
            </div>
            <div className="paper-mode-note">
              <strong>家長提示</strong>
              <span>如果同一課題連續出現，先重溫概念，再做新題，效果比盲目刷題更穩定。</span>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
