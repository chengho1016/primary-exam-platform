import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink, ProgressBar, SectionHeading } from "@/components/ui";
import { buildAllowedGradeLabel, getAllowedGrades } from "@/lib/auth/grade-access";
import { requireUser } from "@/lib/auth/session";
import { isOnlinePracticeEnabled } from "@/lib/features";
import { getDashboardLearningData } from "@/lib/learning/learning-repository";
import { subjects } from "@/lib/site-config";

export const metadata = { title: "會員首頁" };

const practiceMissionSteps = [
  { label: "1", title: "做15題", description: "短時間完成一組題目。" },
  { label: "2", title: "即時核對", description: "每題即時知道對錯。" },
  { label: "3", title: "追錯題", description: "下次集中重練弱項。" },
] as const;

const printMissionSteps = [
  { label: "1", title: "揀試卷", description: "按年級同科目搵卷。" },
  { label: "2", title: "預覽內容", description: "確認題量同頁數。" },
  { label: "3", title: "列印", description: "輸出水印紙本。" },
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
  const recommendedHref = isOnlinePracticeEnabled && learning.recommendedPaper ? `/practice/${learning.recommendedPaper.id}` : "/papers";
  const missionSteps = isOnlinePracticeEnabled ? practiceMissionSteps : printMissionSteps;

  return (
    <AppShell activePath="/dashboard">
      <div className="app-content">
        <header className="app-page-header dashboard-header dashboard-command-header clean-dashboard-header">
          <div>
            <p className="eyebrow">會員首頁</p>
            <h1>你好，{user.displayName}</h1>
            <p>目前開放：{allowedGradeLabel}</p>
          </div>
          <div className="dashboard-header-right">
            <span className="dashboard-today">{new Intl.DateTimeFormat("zh-HK", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
            <ButtonLink href="/papers" variant="secondary">找試卷</ButtonLink>
          </div>
        </header>

        <div className="dashboard-hero dashboard-mission-grid">
          <section className="welcome-card dashboard-mission-card">
            <div>
              <p className="eyebrow">今日任務</p>
              <h2>{isOnlinePracticeEnabled ? (learning.recommendedPaper ? "完成一組練習" : "先選一份試卷") : "先揀一份試卷"}</h2>
              <p>{isOnlinePracticeEnabled && learning.recommendedPaper ? learning.recommendedPaper.title : "進入試卷庫，預覽後即可列印。"}</p>
              <ButtonLink href={recommendedHref}>{isOnlinePracticeEnabled && learning.recommendedPaper ? "開始" : "前往試卷庫"}<ArrowRightIcon /></ButtonLink>
            </div>
          </section>

          <aside className="profile-card dashboard-rhythm-card">
            <div className="child-card-top">
              <div className="child-avatar">{child?.displayName.slice(0, 1) ?? "童"}</div>
              <div><h3>{child?.displayName ?? "尚未加入孩子"}</h3><span>小{child?.grade ?? "-"}</span></div>
            </div>
            {childProfiles.length ? (
              <div className="child-grade-chips" aria-label="孩子年級">
                {childProfiles.map((profile) => <Link href={`/papers?grade=${profile.grade}`} key={profile.id}>{profile.displayName}<span>小{profile.grade}</span></Link>)}
              </div>
            ) : null}
            <div className="mission-mini-list clean-mission-list">
              {missionSteps.map((step) => <div key={step.title}><span>{step.label}</span><strong>{step.title}</strong><small>{step.description}</small></div>)}
            </div>
          </aside>
        </div>

        <SectionHeading title="選擇科目" description={`按${child?.displayName ?? "孩子"}年級顯示可用試卷。`} />
        <div className="subject-grid">
          {subjects.map((subject) => <Link className={`subject-tile tone-${subject.tone}`} href={`/papers?subject=${subject.id}`} key={subject.id}><span>{subject.shortName}</span><strong>{subject.name}</strong><small>查看試卷 →</small></Link>)}
        </div>

        {isOnlinePracticeEnabled ? (
          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-header"><h3>最近練習</h3><Link href="/parent">查看全部</Link></div>
              <div className="attempt-list">
                {learning.recentAttempts.map((attempt) => <article className="attempt-row" key={attempt.id}><span className="attempt-icon">{attempt.paper.subject.slice(0, 1)}</span><div><h4>{attempt.paper.title}</h4><p>{attempt.paper.subject} · {attempt.completedAt ? new Intl.DateTimeFormat("zh-HK").format(attempt.completedAt) : "進行中"}</p></div><div className="attempt-score"><strong>{attempt.score}/{attempt.maximumMark}</strong><span>{attempt.maximumMark ? Math.round((attempt.score ?? 0) / attempt.maximumMark * 100) : 0}%</span></div></article>)}
                {learning.recentAttempts.length === 0 ? <p className="row-muted">完成第一次練習後會顯示紀錄。</p> : null}
              </div>
            </section>
            <section className="panel">
              <div className="panel-header"><h3>本週學習</h3><span className="badge badge-sun">{learning.weeklyAttemptCount}次</span></div>
              <ProgressBar value={goalProgress} label={`${Math.round(goalProgress)}%`} />
              <div className="streak-grid">{weekDays.map((day, index) => <span className={index < Math.min(learning.weeklyAttemptCount, 7) ? "done" : ""} key={day}>{day}</span>)}</div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
