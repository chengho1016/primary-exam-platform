import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PaperCard } from "@/components/paper-card";
import { buildAllowedGradeLabel, getAllowedGrades, isGradeRestrictedUser } from "@/lib/auth/grade-access";
import { getCurrentUser } from "@/lib/auth/session";
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
  const [filters, user] = await Promise.all([searchParams, getCurrentUser()]);
  const requestedGrade = Number(filters.grade);
  const gradeRestricted = Boolean(user && isGradeRestrictedUser(user));
  const allowedGrades = user ? getAllowedGrades(user) : [];
  const visibleGrades = gradeRestricted ? allowedGrades : grades;
  const selectedGrade = Number.isInteger(requestedGrade) && requestedGrade >= 1 && requestedGrade <= 6 && (!gradeRestricted || allowedGrades.includes(requestedGrade)) ? String(requestedGrade) : "";
  const selectedSubject = filters.subject && subjectValues[filters.subject] ? filters.subject : "";
  const papers = await listPublishedPapers({
    grade: selectedGrade ? Number(selectedGrade) : undefined,
    subject: selectedSubject ? subjectValues[selectedSubject] : undefined,
    allowedGrades: gradeRestricted ? allowedGrades : undefined,
  });
  const selectedSubjectLabel = selectedSubject ? subjectValues[selectedSubject] : "全部科目";
  const gradeScopeLabel = gradeRestricted ? buildAllowedGradeLabel(allowedGrades) : "P1-P6";
  const currentGradeLabel = selectedGrade ? `小${selectedGrade}` : gradeRestricted ? gradeScopeLabel : "全部年級";

  return (
    <AppShell activePath="/papers">
      <div className="app-content">
        <header className="app-page-header papers-header paper-library-hero">
          <div>
            <p className="eyebrow">影印試卷庫</p>
            <h1>揀一份卷，預覽後立即列印</h1>
            <p>{currentGradeLabel} · {selectedSubjectLabel} · 找到 {papers.length} 份可用試卷。現階段先專注水印影印試卷；線上練習會拆成獨立服務，稍後再開放。</p>
          </div>
          <div className="library-hero-stats" aria-label="試卷庫摘要">
            <span><strong>{papers.length}</strong>份試卷</span>
            <span><strong>{currentGradeLabel}</strong>年級</span>
            <span><strong>{selectedSubjectLabel}</strong>科目</span>
          </div>
        </header>

        <section className="paper-toolbar" aria-label="快速篩選">
          <div>
            <span className="toolbar-label">年級</span>
            <div className="filter-chips">
              <Link className={!selectedGrade ? "active" : ""} href={buildFilterHref({ subject: selectedSubject })}>全部</Link>
              {visibleGrades.map((gradeOption) => (
                <Link className={selectedGrade === String(gradeOption) ? "active" : ""} href={buildFilterHref({ grade: String(gradeOption), subject: selectedSubject })} key={gradeOption}>小{gradeOption}</Link>
              ))}
            </div>
            {gradeRestricted ? <p className="grade-scope-note">此帳戶只開放：{gradeScopeLabel}</p> : null}
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
          <div className="field"><label htmlFor="grade-filter">年級</label><select id="grade-filter" name="grade" defaultValue={selectedGrade}><option value="">全部可用年級</option>{visibleGrades.map((gradeOption) => <option value={gradeOption} key={gradeOption}>小{gradeOption}</option>)}</select></div>
          <div className="field"><label htmlFor="subject-filter">科目</label><select id="subject-filter" name="subject" defaultValue={selectedSubject}><option value="">全部科目</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></div>
          <button className="button button-primary button-small" type="submit">套用篩選</button>
        </form>

        {papers.length ? (
          <div className="paper-grid">{papers.map((paper) => <PaperCard paper={paper} key={paper.id} />)}</div>
        ) : (
          <div className="empty-state upgraded-empty-state">
            <span className="empty-state-symbol" aria-hidden="true">卷</span>
            <h2>暫時未有符合條件的試卷</h2>
            <p>{gradeRestricted ? "此帳戶沒有這個年級的服務權限；請改用已登記小朋友年級。" : "試下切換年級或科目；如果你是管理員，可以先到後台上傳新試卷。"}</p>
            <div className="empty-actions"><Link className="button button-secondary button-small" href="/papers">清除篩選</Link><Link className="button button-primary button-small" href="/admin/papers/new">上傳試卷</Link></div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
