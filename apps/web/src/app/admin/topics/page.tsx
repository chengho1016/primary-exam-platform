import Link from "next/link";
import { renameMathTopicAction } from "@/app/admin/actions";
import { AppShell } from "@/components/app-shell";
import { Badge, ProgressBar } from "@/components/ui";
import { getMathTopicManagement } from "@/lib/admin/admin-repository";
import { describeTopicReadiness, type TopicInsight } from "@/lib/admin/topic-insights";

export const metadata = { title: "數學課題管理" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ renamed?: string; unchanged?: string; from?: string; to?: string; count?: string }>;

function getTotals(topics: TopicInsight[]) {
  return topics.reduce(
    (total, topic) => ({
      questionCount: total.questionCount + topic.questionCount,
      verifiedOnlineCount: total.verifiedOnlineCount + topic.verifiedOnlineCount,
      needsReviewCount: total.needsReviewCount + topic.needsReviewCount,
      printOnlyCount: total.printOnlyCount + topic.printOnlyCount,
      worksheetReadyTopicCount: total.worksheetReadyTopicCount + (topic.verifiedOnlineCount >= 30 ? 1 : 0),
    }),
    { questionCount: 0, verifiedOnlineCount: 0, needsReviewCount: 0, printOnlyCount: 0, worksheetReadyTopicCount: 0 },
  );
}

function formatDifficultyCounts(topic: TopicInsight) {
  return [
    ["基礎", topic.difficultyCounts.easy],
    ["標準", topic.difficultyCounts.medium],
    ["進階", topic.difficultyCounts.hard],
    ["其他", topic.difficultyCounts.other],
  ].filter(([, count]) => Number(count) > 0);
}

function TopicNamesDatalist({ topics }: { topics: TopicInsight[] }) {
  return (
    <datalist id="math-topic-targets">
      {topics.map((topic) => <option key={topic.name} value={topic.name} />)}
    </datalist>
  );
}

export default async function AdminTopicsPage({ searchParams }: { searchParams: SearchParams }) {
  const [topics, filters] = await Promise.all([getMathTopicManagement(), searchParams]);
  const totals = getTotals(topics);

  return (
    <AppShell activePath="/admin/topics" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>數學課題管理</h1>
            <p>第一版先集中數學科，用現有題目 `topic` / `subtopic` 做課題整理、改名同合併，為之後隨機組卷鋪路。</p>
          </div>
          <div className="admin-header-actions">
            <Link className="button button-secondary button-small" href="/admin/questions?subject=%E6%95%B8%E5%AD%B8">查看數學題庫</Link>
            <Link className="button button-primary button-small" href="/admin/questions/new?subject=%E6%95%B8%E5%AD%B8">＋ 新增數學題</Link>
          </div>
        </header>

        {filters.renamed === "1" ? (
          <p className="success-banner">
            已將「{filters.from}」改為「{filters.to}」，共更新 {filters.count ?? "0"} 題。若新名稱本身已存在，系統已自動合併。
          </p>
        ) : null}
        {filters.unchanged === "1" ? <p className="warning-banner">課題名稱無變更，未有更新題目。</p> : null}

        <section className="panel admin-guidance-panel">
          <h3>今次升級範圍</h3>
          <p>暫時唔改資料庫 schema，避免大遷移風險；先提供管理員可見、可修正、可合併嘅數學課題控制台。之後先加正式 Topic table、QuestionTopic、多課題標籤同 GeneratedWorksheet。</p>
          <div className="admin-status-stack horizontal">
            <Badge tone="mint">只處理數學科</Badge>
            <Badge tone="blue">30題 = 完整組卷目標</Badge>
            <Badge tone="sun">改名到既有課題即合併</Badge>
            <Badge tone="gray">保留 Question.topic 舊欄位</Badge>
          </div>
        </section>

        <section className="admin-grid admin-question-metrics" aria-label="數學課題概覽">
          <div className="admin-stat tone-blue"><span>數學課題</span><strong>{topics.length}</strong><small>由 Question.topic 即時計算</small></div>
          <div className="admin-stat tone-mint"><span>可練習題目</span><strong>{totals.verifiedOnlineCount}</strong><small>onlineEligible + verified</small></div>
          <div className="admin-stat tone-coral"><span>待覆核題目</span><strong>{totals.needsReviewCount}</strong><small>補答案規則後才入組卷池</small></div>
          <div className="admin-stat tone-sun"><span>足30題課題</span><strong>{totals.worksheetReadyTopicCount}</strong><small>可進入隨機組卷設計</small></div>
        </section>

        <TopicNamesDatalist topics={topics} />

        {topics.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-topic-table">
              <thead>
                <tr>
                  <th>課題</th>
                  <th>組卷準備</th>
                  <th>題量分佈</th>
                  <th>子課題</th>
                  <th>來源試卷</th>
                  <th>改名 / 合併</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => {
                  const readiness = describeTopicReadiness(topic);
                  const difficultyCounts = formatDifficultyCounts(topic);

                  return (
                    <tr key={topic.name}>
                      <td className="topic-name-cell">
                        <strong>{topic.name}</strong>
                        <small>{topic.questionCount} 題 · {topic.paperCount} 份卷</small>
                      </td>
                      <td className="topic-readiness-cell">
                        <Badge tone={readiness.tone}>{readiness.label}</Badge>
                        <ProgressBar value={readiness.percent} label={`${topic.verifiedOnlineCount}/30 可練習題`} />
                        {readiness.shortfall > 0 ? <small>仲差 {readiness.shortfall} 題先夠完整30題組卷</small> : <small>已達完整組卷題量</small>}
                      </td>
                      <td>
                        <div className="admin-status-stack">
                          <Badge tone="mint">可練習 {topic.verifiedOnlineCount}</Badge>
                          {topic.needsReviewCount ? <Badge tone="coral">待覆核 {topic.needsReviewCount}</Badge> : null}
                          {topic.printOnlyCount ? <Badge tone="sun">只列印 {topic.printOnlyCount}</Badge> : null}
                          {difficultyCounts.map(([label, count]) => <span className="topic-mini-meta" key={label}>{label}：{count}</span>)}
                        </div>
                      </td>
                      <td className="topic-list-cell">
                        {topic.subtopics.length ? topic.subtopics.slice(0, 6).map((subtopic) => (
                          <span key={subtopic.name}>{subtopic.name} <em>{subtopic.count}</em></span>
                        )) : <span className="row-muted">未有子課題</span>}
                      </td>
                      <td className="topic-paper-cell">
                        {topic.papers.slice(0, 4).map((paper) => (
                          <span key={paper.id}>{paper.code} <em>{paper.count}</em></span>
                        ))}
                        {topic.papers.length > 4 ? <small>+{topic.papers.length - 4} 份</small> : null}
                      </td>
                      <td>
                        <form action={renameMathTopicAction} className="topic-rename-form">
                          <input name="currentTopic" type="hidden" value={topic.name} />
                          <input aria-label={`將 ${topic.name} 改名或合併到`} defaultValue={topic.name} list="math-topic-targets" name="nextTopic" required />
                          <button className="button button-secondary button-small" type="submit">儲存</button>
                        </form>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link href={`/admin/questions?subject=${encodeURIComponent("數學")}&topic=${encodeURIComponent(topic.name)}`}>查看題目</Link>
                          <Link href={`/admin/questions/new?subject=${encodeURIComponent("數學")}&topic=${encodeURIComponent(topic.name)}`}>新增同課題</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="panel empty-state-panel">
            <h3>暫時未有數學題目</h3>
            <p>先上傳數學試卷或逐條新增題目，系統就會自動整理課題。</p>
            <Link className="button button-primary" href="/admin/questions/new?subject=%E6%95%B8%E5%AD%B8">＋ 新增數學題</Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
