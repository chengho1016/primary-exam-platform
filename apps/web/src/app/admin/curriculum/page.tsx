import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { getAdminCurriculumOverview } from "@/lib/admin/admin-repository";
import { CurriculumBackfillButton } from "./backfill-button";

export const metadata = { title: "課程管理" };
export const dynamic = "force-dynamic";

type SubjectRow = Awaited<ReturnType<typeof getAdminCurriculumOverview>>["subjects"][number];
type TopicRow = Awaited<ReturnType<typeof getAdminCurriculumOverview>>["topics"][number];
type LegacySubjectGroup = Awaited<ReturnType<typeof getAdminCurriculumOverview>>["legacySubjectGroups"][number];

function readinessTone(value: number): "mint" | "sun" | "coral" {
  return value === 0 ? "mint" : value < 10 ? "sun" : "coral";
}

function readinessText(value: number) {
  return value === 0 ? "已連結" : `${value} 待 backfill`;
}

export default async function AdminCurriculumPage() {
  const { curricula, subjects, topics, legacySubjectGroups, counts } = await getAdminCurriculumOverview();

  const metrics = [
    { label: "課程", value: counts.totalCurricula, detail: "Curriculum", tone: "blue" },
    { label: "科目", value: counts.totalSubjects, detail: `${counts.activeSubjects} active`, tone: "mint" },
    { label: "Topic", value: counts.totalTopics, detail: "正規化課題", tone: "sun" },
    { label: "Knowledge Point", value: counts.totalKnowledgePoints, detail: "知識點", tone: "coral" },
  ] as const;
  const missingBackfillCount = counts.papersMissingSubject + counts.questionsMissingCurriculum + counts.questionsMissingSubject + counts.questionsMissingTopic + counts.questionsMissingKnowledgePoint;

  return (
    <AppShell activePath="/admin/curriculum" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>課程管理</h1>
            <p>Phase 1 正規化地基：Subject / Curriculum / Topic / KnowledgePoint。保留舊欄位，逐步 backfill。</p>
          </div>
          <span className="badge badge-blue">Data-driven taxonomy</span>
        </header>

        <section className="admin-grid admin-question-metrics" aria-label="課程指標">
          {metrics.map((metric) => (
            <article className={`admin-stat tone-${metric.tone}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        <section className="form-panel admin-guidance-panel">
          <div className="panel-header"><h3>正規化進度</h3><span>保留 legacy 欄位兼容現有 production</span></div>
          <div className="database-list topic-list">
            <div><span>Paper.subjectId</span><strong>{readinessText(counts.papersMissingSubject)}</strong><small>舊 Paper.subject 仍保留</small></div>
            <div><span>Question.curriculumId</span><strong>{readinessText(counts.questionsMissingCurriculum)}</strong><small>AI 推薦需要課程層</small></div>
            <div><span>Question.subjectId</span><strong>{readinessText(counts.questionsMissingSubject)}</strong><small>科目 filter 將逐步改用 ID</small></div>
            <div><span>Question.topicId</span><strong>{readinessText(counts.questionsMissingTopic)}</strong><small>Practice Template / 抽題地基</small></div>
            <div><span>Question.knowledgePointId</span><strong>{readinessText(counts.questionsMissingKnowledgePoint)}</strong><small>有 subtopic 但未連知識點</small></div>
          </div>
          <CurriculumBackfillButton needsBackfill={missingBackfillCount > 0} />
        </section>

        <div className="dashboard-grid database-grid">
          <section className="panel">
            <div className="panel-header"><h3>Curriculum</h3><Badge tone="blue">{curricula.length}</Badge></div>
            <div className="attempt-list">
              {curricula.map((curriculum) => (
                <div className="attempt-row" key={curriculum.id}>
                  <span className="attempt-icon">課</span>
                  <div><h4>{curriculum.nameZh}</h4><p>{curriculum.code} · {curriculum.regionCode ?? "未設定地區"}</p></div>
                  <Badge tone={curriculum.isActive ? "mint" : "gray"}>{curriculum.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h3>Legacy subject 分佈</h3><span>Paper.subject</span></div>
            <div className="database-list">
              {legacySubjectGroups.map((group: LegacySubjectGroup) => (
                <div key={group.subject}><span>{group.subject}</span><strong>{group._count._all}</strong><small>份試卷</small></div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-header"><h3>Subject</h3><span>香港小學核心科目，不再寫死於 UI</span></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>排序</th><th>Code</th><th>中文</th><th>英文</th><th>狀態</th><th>試卷</th><th>題目</th><th>Topic</th></tr></thead>
              <tbody>
                {subjects.map((subject: SubjectRow) => (
                  <tr key={subject.id}>
                    <td>{subject.displayOrder}</td>
                    <td>{subject.code}</td>
                    <td>{subject.nameZh}</td>
                    <td>{subject.nameEn ?? "—"}</td>
                    <td><Badge tone={subject.isActive ? "mint" : "gray"}>{subject.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td>{subject._count.papers}</td>
                    <td>{subject._count.questions}</td>
                    <td>{subject._count.topics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><h3>Topic / Knowledge Point</h3><span>最多顯示 80 個 Topic</span></div>
          <div className="admin-table-wrap">
            <table className="admin-table database-audit-table">
              <thead><tr><th>科目</th><th>Topic</th><th>Code</th><th>題目</th><th>知識點</th><th>狀態</th></tr></thead>
              <tbody>
                {topics.map((topic: TopicRow) => (
                  <tr key={topic.id}>
                    <td>{topic.subject.nameZh}<br/><small>{topic.subject.code}</small></td>
                    <td>{topic.nameZh}<br/><small>{topic.knowledgePoints.map((kp) => `${kp.nameZh} (${kp._count.questions})`).join("、") || "未有知識點"}</small></td>
                    <td>{topic.code}</td>
                    <td>{topic._count.questions}</td>
                    <td>{topic._count.knowledgePoints}</td>
                    <td><Badge tone={topic.isActive ? readinessTone(0) : "gray"}>{topic.isActive ? "Active" : "Inactive"}</Badge></td>
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
