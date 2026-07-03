import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink, ProgressBar, SectionHeading } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getDashboardLearningData } from "@/lib/learning/learning-repository";
import { subjects } from "@/lib/site-config";

export const metadata = { title: "學習首頁" };

const missionSteps = [
  { label: "第一步", title: "做15題", description: "短時間完成一組題目，先建立今日節奏。" },
  { label: "第二步", title: "即時核對", description: "每題即時知道對錯，不用等家長改卷。" },
  { label: "第三步", title: "追錯題", description: "錯題自動保存，下次可以針對弱項重練。" },
] as const;

const weekDays = ["一", "二", "三", "四", "五", "六", "日"] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const child = user.children[0];
  const learning = child ? await getDashboardLearningData(child.id) : { weeklyAttemptCount: 0, recentAttempts: [], recommendedPaper: null };
  const weeklyGoal = 4;
  const goalProgress = Math.min(100, learning.weeklyAttemptCount / weeklyGoal * 100);
  const recommendedHref = learning.recommendedPaper ? `/practice/${learning.recommendedPaper.id}` : "/papers?subject=math";

  return (
    <AppShell activePath="/dashboard">
      <div className="app-content">
        <header className="app-page-header dashboard-header dashboard-command-header">
          <div><p className="eyebrow">Learning OS · 今日任務中心</p><h1>你好，{user.displayName}</h1><p>{child?.displayName ?? "孩子"}今個星期已完成{learning.weeklyAttemptCount}次練習；下一步係保持短、準、穩。</p></div>
          <ButtonLink href="/papers" variant="secondary">尋找試卷</ButtonLink>
        </header>
        <div className="dashboard-hero dashboard-mission-grid">
          <section className="welcome-card dashboard-mission-card">
            <div>
              <p className="eyebrow">建議練習</p>
              <h2>{learning.recommendedPaper ? "今日先完成一組15題" : "先選一份數學試卷"}</h2>
              <p>{learning.recommendedPaper ? `${learning.recommendedPaper.title} 已準備好網上練習，做完會即時更新錯題本。` : "目前未有足夠題目的建議練習，先到試卷庫查看可用內容。"}</p>
              <ButtonLink href={recommendedHref}>{learning.recommendedPaper ? "開始今日任務" : "前往試卷庫"}<ArrowRightIcon /></ButtonLink>
            </div>
          </section>
          <aside className="profile-card dashboard-rhythm-card">
            <div className="child-card-top"><div className="child-avatar">{child?.displayName.slice(0, 1) ?? "童"}</div><div><h3>{child?.displayName ?? "尚未加入孩子"}</h3><span>小{child?.grade ?? "-"} · 本週第{learning.weeklyAttemptCount}次練習</span></div></div>
            <div className="weekly-score"><div><small>本週目標</small><strong>{learning.weeklyAttemptCount} / {weeklyGoal}</strong></div><span className="badge badge-mint">{learning.weeklyAttemptCount >= weeklyGoal ? "已達標" : `還差${weeklyGoal - learning.weeklyAttemptCount}次`}</span></div>
            <ProgressBar value={goalProgress} label={`${Math.round(goalProgress)}%`} />
            <div className="mission-mini-list">
              {missionSteps.map((step) => <div key={step.title}><span>{step.label}</span><strong>{step.title}</strong><small>{step.description}</small></div>)}
            </div>
          </aside>
        </div>

        <SectionHeading title="選擇科目" description={`內容會自動配合${child?.displayName ?? "孩子"}目前的小${child?.grade ?? "學"}年級。`} />
        <div className="subject-grid">
          {subjects.map((subject) => <Link className={`subject-tile tone-${subject.tone}`} href={`/papers?subject=${subject.id}`} key={subject.id}><span>{subject.shortName}</span><strong>{subject.name}</strong><small>查看試卷 →</small></Link>)}
        </div>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-header"><h3>最近練習</h3><Link href="/parent">查看全部</Link></div>
            <div className="attempt-list">
              {learning.recentAttempts.map((attempt) => <article className="attempt-row" key={attempt.id}><span className="attempt-icon">{attempt.paper.subject.slice(0, 1)}</span><div><h4>{attempt.paper.title}</h4><p>{attempt.paper.subject} · {attempt.completedAt ? new Intl.DateTimeFormat("zh-HK").format(attempt.completedAt) : "進行中"}</p></div><div className="attempt-score"><strong>{attempt.score}/{attempt.maximumMark}</strong><span>{attempt.maximumMark ? Math.round((attempt.score ?? 0) / attempt.maximumMark * 100) : 0}%</span></div></article>)}
              {learning.recentAttempts.length === 0 ? <p style={{ color: "var(--ink-soft)", fontSize: 12 }}>完成第一次15題練習後會顯示紀錄。</p> : null}
            </div>
          </section>
          <section className="panel">
            <div className="panel-header"><h3>本週學習</h3><span className="badge badge-sun">{learning.weeklyAttemptCount}次</span></div>
            <p style={{ color: "var(--ink-soft)", fontSize: 12, lineHeight: 1.7 }}>保持短而穩定的練習，比一次做大量題目更容易建立習慣。</p>
            <div className="streak-grid">{weekDays.map((day, index) => <span className={index < Math.min(learning.weeklyAttemptCount, 7) ? "done" : ""} key={day}>{day}</span>)}</div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
