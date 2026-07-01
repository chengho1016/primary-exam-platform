import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PaperCard } from "@/components/paper-card";
import { listPublishedPapers } from "@/lib/papers/paper-repository";
import { grades, subjects } from "@/lib/site-config";

export const metadata = { title: "試卷庫" };

const subjectValues: Record<string, string> = { chinese: "中文", english: "英文", math: "數學", humanities: "人文", science: "科學" };

function buildFilterHref(next: { grade?: string; subject?: string }) {
  const params = new URLSearchParams();
  if (next.grade) params.set("grade", next.grade);
  if (next.subject) params.set("subject", next.subject);
  const query = params.toString();
  return query ? `/papers?${query}` : "/papers";
}

export default async function PapersPage({ searchParams }: { searchParams: Promise<{ grade?: string; subject?: string }> }) {
  const filters = await searchParams;
  const grade = Number(filters.grade);
  const selectedGrade = Number.isInteger(grade) && grade >= 1 && grade <= 6 ? String(grade) : "";
  const selectedSubject = filters.subject && subjectValues[filters.subject] ? filters.subject : "";
  const papers = await listPublishedPapers({
    grade: selectedGrade ? Number(selectedGrade) : undefined,
    subject: selectedSubject ? subjectValues[selectedSubject] : undefined,
  });
  const selectedSubjectLabel = selectedSubject ? subjectValues[selectedSubject] : "全部科目";

  return (
    <AppShell activePath="/papers">
      <div className="app-content">
        <header className="app-page-header papers-header">
          <div>
            <p className="eyebrow">試卷庫</p>
            <h1>選試卷，然後開始練習或列印</h1>
            <p>{selectedGrade ? `小${selectedGrade}` : "全部年級"} · {selectedSubjectLabel} · 找到 {papers.length} 份可用試卷。</p>
          </div>
        </header>

        <section className="paper-toolbar" aria-label="快速篩選">
          <div>
            <span className="toolbar-label">年級</span>
            <div className="filter-chips">
              <Link className={!selectedGrade ? "active" : ""} href={buildFilterHref({ subject: selectedSubject })}>全部</Link>
              {grades.map((gradeOption) => (
                <Link className={selectedGrade === String(gradeOption) ? "active" : ""} href={buildFilterHref({ grade: String(gradeOption), subject: selectedSubject })} key={gradeOption}>小{gradeOption}</Link>
              ))}
            </div>
          </div>
          <div>
            <span className="toolbar-label">科目</span>
            <div className="filter-chips subject-chips">
              <Link className={!selectedSubject ? "active" : ""} href={buildFilterHref({ grade: selectedGrade })}>全部</Link>
              {subjects.map((subject) => (
                <Link className={selectedSubject === subject.id ? "active" : ""} href={buildFilterHref({ grade: selectedGrade, subject: subject.id })} key={subject.id}>{subject.name}</Link>
              ))}
            </div>
          </div>
        </section>

        <form className="filter-bar compact-filter" method="get">
          <div className="field"><label htmlFor="grade-filter">年級</label><select id="grade-filter" name="grade" defaultValue={selectedGrade}><option value="">全部年級</option>{grades.map((gradeOption) => <option value={gradeOption} key={gradeOption}>小{gradeOption}</option>)}</select></div>
          <div className="field"><label htmlFor="subject-filter">科目</label><select id="subject-filter" name="subject" defaultValue={selectedSubject}><option value="">全部科目</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></div>
          <button className="button button-primary button-small" type="submit">套用篩選</button>
        </form>

        {papers.length ? (
          <div className="paper-grid">{papers.map((paper) => <PaperCard paper={paper} key={paper.id} />)}</div>
        ) : (
          <div className="empty-state upgraded-empty-state">
            <span>📚</span>
            <h2>暫時未有符合條件的試卷</h2>
            <p>試下切換年級或科目；如果你是管理員，可以先到後台上傳新試卷。</p>
            <div className="empty-actions"><Link className="button button-secondary button-small" href="/papers">清除篩選</Link><Link className="button button-primary button-small" href="/admin/papers/new">上傳試卷</Link></div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
