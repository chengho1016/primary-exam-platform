import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink, ProgressBar, SectionHeading } from "@/components/ui";
import { buildAllowedGradeLabel, getAllowedGrades } from "@/lib/auth/grade-access";
import { requireUser } from "@/lib/auth/session";
import { isOnlinePracticeEnabled, onlinePracticeStatus } from "@/lib/features";
import { getDashboardLearningData } from "@/lib/learning/learning-repository";
import { subjects } from "@/lib/site-config";

export const metadata = { title: "會員首頁" };

const practiceMissionSteps = [
  { label: "第一步", title: "做15題", description: "短時間完成一組題目，先建立今日節奏。" },
  { label: "第二步", title: "即時核對", description: "每題即時知道對錯，不用等家長改卷。" },
  { label: "第三步", title: "追錯題", description: "錯題自動保存，下次可以針對弱項重練。" },
] as const;

const printMissionSteps = [
  { label: "第一步", title: "揀試卷", description: "按孩子年級同科目，先找合適的紙本試卷。" },
  { label: "第二步", title: "預覽內容", description: "確認頁數、題量同課題，避免列印錯卷。" },
  { label: "第三步", title: "水印列印", description: "以會員水印輸出完整試卷，方便家庭測驗。" },
] as const;

const weekDays = ["一", "二", "三", "四", "五", "六", "日"] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const child = user.children[0];
  const childProfiles = user.children.slice(0, 3);
  const allowedGradeLabel = buildAllowedGradeLabel(getAllowedGrades(user));
  const learning = child ? await getDashboardLearningData(child.id, child.grade) : { weeklyAttemptCount: 0, recentAttempts: [], recommendedPaper: null };
  const weeklyGoal = 4;
  const goalProgress = Math.min(100, learning.weeklyAttemptCount / weeklyGoal * 100);
  const gradePapersHref = "/papers";
  const recommendedHref = isOnlinePracticeEnabled && learning.recommendedPaper ? `/practice/${learning.recommendedPaper.id}` : "/papers";
  const missionSteps = isOnlinePracticeEnabled ? practiceMissionSteps : printMissionSteps;

  return (
    <AppShell activePath="/dashboard">
      <div className="app-content">
        <header className="app-page-header dashboard-header dashboard-command-header">
          <div>
            <p className="eyebrow">{isOnlinePracticeEnabled ? "Learning OS · 今日任務中心" : "Print OS · 影印試卷中心"}</p>
            <h1>你好，{user.displayName}</h1>
            <p>{isOnlinePracticeEnabled ? `${child?.displayName ?? "孩子"}今個星期已完成${learning.weeklyAttemptCount}次練習；帳戶只會開放 ${allowedGradeLabel} 的試卷服務。` : `現階段先專注 ${allowedGradeLabel} 的影印試卷服務；線上練習會之後獨立重開。`}</p>
          </div>
          <div className="dashboard-header-right">
            <span className="dashboard-today">{new Intl.DateTimeFormat("zh-HK", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
            <ButtonLink href={gradePapersHref} variant="secondary">尋找及列印試卷</ButtonLink>
          </div>
        </header>
        <div className="dashboard-hero dashboard-mission-grid">
          <section className="welcome-card dashboard-mission-card">
            <div>
              <p className="eyebrow">{isOnlinePracticeEnabled ? "建議練習" : "影印試卷"}</p>
              <h2>{isOnlinePracticeEnabled ? (learning.recommendedPaper ? "今日先完成一組15題" : "先選一份數學試卷") : "先揀一份試卷列印"}</h2>
              <p>{isOnlinePracticeEnabled ? (learning.recommendedPaper ? `${learning.recommendedPaper.title} 已準備好網上練習，做完會即時更新錯題本。` : "目前未有足夠題目的建議練習，先到試卷庫查看可用內容。") : "線上練習暫停期間，家長可以先用試卷庫預覽及水印列印完整紙本。"}</p>
              <ButtonLink href={recommendedHref}>{isOnlinePracticeEnabled && learning.recommendedPaper ? "開始今日任務" : "前往試卷庫"}<ArrowRightIcon /></ButtonLink>
            </div>
          </section>
          <aside className="profile-card dashboard-rhythm-card">
            <div className="child-card-top"><div className="child-avatar">{child?.displayName.slice(0, 1) ?? "童"}</div><div><h3>{child?.displayName ?? "尚未加入孩子"}</h3><span>{isOnlinePracticeEnabled ? `小${child?.grade ?? "-"} · 本週第${learning.weeklyAttemptCount}次練習` : `小${child?.grade ?? "-"} · 影印試卷服務開放中`}</span></div></div>
            {childProfiles.length ? (
              <div className="child-grade-chips" aria-label="孩子年級">
                {childProfiles.map((profile) => <Link href={`/papers?grade=${profile.grade}`} key={profile.id}>{profile.displayName}<span>小{profile.grade}</span></Link>)}
              </div>
            ) : null}
            <div className="weekly-score"><div><small>{isOnlinePracticeEnabled ? "本週目標" : "目前模式"}</small><strong>{isOnlinePracticeEnabled ? `${learning.weeklyAttemptCount} / ${weeklyGoal}` : "影印優先"}</strong></div><span className="badge badge-mint">{isOnlinePracticeEnabled ? (learning.weeklyAttemptCount >= weeklyGoal ? "已達標" : `還差${weeklyGoal - learning.weeklyAttemptCount}次`) : "線上練習暫停"}</span></div>
            <ProgressBar value={isOnlinePracticeEnabled ? goalProgress : 100} label={isOnlinePracticeEnabled ? `${Math.round(goalProgress)}%` : "Print"} />
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
          {isOnlinePracticeEnabled ? (
            <section className="panel">
              <div className="panel-header"><h3>最近練習</h3><Link href="/parent">查看全部</Link></div>
              <div className="attempt-list">
                {learning.recentAttempts.map((attempt) => <article className="attempt-row" key={attempt.id}><span className="attempt-icon">{attempt.paper.subject.slice(0, 1)}</span><div><h4>{attempt.paper.title}</h4><p>{attempt.paper.subject} · {attempt.completedAt ? new Intl.DateTimeFormat("zh-HK").format(attempt.completedAt) : "進行中"}</p></div><div className="attempt-score"><strong>{attempt.score}/{attempt.maximumMark}</strong><span>{attempt.maximumMark ? Math.round((attempt.score ?? 0) / attempt.maximumMark * 100) : 0}%</span></div></article>)}
                {learning.recentAttempts.length === 0 ? <p style={{ color: "var(--ink-soft)", fontSize: 12 }}>完成第一次15題練習後會顯示紀錄。</p> : null}
              </div>
            </section>
          ) : (
            <section className="panel">
              <div className="panel-header"><h3>影印試卷流程</h3><Link href="/papers">查看試卷庫</Link></div>
              <p style={{ color: "var(--ink-soft)", fontSize: 12, lineHeight: 1.7 }}>先按孩子年級及科目揀卷，進入詳情頁預覽，再用會員水印列印完整紙本。線上練習紀錄會保留，功能重開後再使用。</p>
              <div className="empty-actions"><ButtonLink href="/papers" variant="secondary">前往試卷庫</ButtonLink></div>
            </section>
          )}
          <section className="panel">
            <div className="panel-header"><h3>{isOnlinePracticeEnabled ? "本週學習" : "線上練習服務"}</h3><span className="badge badge-sun">{isOnlinePracticeEnabled ? `${learning.weeklyAttemptCount}次` : "已暫停"}</span></div>
            <p style={{ color: "var(--ink-soft)", fontSize: 12, lineHeight: 1.7 }}>{isOnlinePracticeEnabled ? "保持短而穩定的練習，比一次做大量題目更容易建立習慣。" : onlinePracticeStatus.pausedDescription}</p>
            {isOnlinePracticeEnabled ? <div className="streak-grid">{weekDays.map((day, index) => <span className={index < Math.min(learning.weeklyAttemptCount, 7) ? "done" : ""} key={day}>{day}</span>)}</div> : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
