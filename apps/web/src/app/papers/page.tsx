import { AppShell } from "@/components/app-shell";
import { PaperCard } from "@/components/paper-card";
import { listPublishedPapers } from "@/lib/papers/paper-repository";

export const metadata = { title: "試卷庫" };

const subjectValues: Record<string, string> = { chinese: "中文", english: "英文", math: "數學", humanities: "人文", science: "科學" };

export default async function PapersPage({ searchParams }: { searchParams: Promise<{ grade?: string; subject?: string }> }) {
  const filters = await searchParams;
  const grade = Number(filters.grade);
  const papers = await listPublishedPapers({
    grade: Number.isInteger(grade) && grade >= 1 && grade <= 6 ? grade : undefined,
    subject: filters.subject ? subjectValues[filters.subject] : undefined,
  });

  return (
    <AppShell activePath="/papers">
      <div className="app-content">
        <header className="app-page-header"><div><h1>試卷練習</h1><p>選擇年級及科目，再決定網上做15題或列印完整試卷。</p></div></header>
        <form className="filter-bar" method="get">
          <div className="field"><label htmlFor="grade-filter">年級</label><select id="grade-filter" name="grade" defaultValue={filters.grade ?? ""}><option value="">全部年級</option>{[1,2,3,4,5,6].map((gradeOption) => <option value={gradeOption} key={gradeOption}>小{gradeOption}</option>)}</select></div>
          <div className="field"><label htmlFor="subject-filter">科目</label><select id="subject-filter" name="subject" defaultValue={filters.subject ?? ""}><option value="">全部科目</option><option value="chinese">中文</option><option value="english">英文</option><option value="math">數學</option><option value="humanities">人文</option><option value="science">科學</option></select></div>
          <button className="button button-primary button-small" type="submit">套用篩選</button>
        </form>
        {papers.length ? <div className="paper-grid">{papers.map((paper) => <PaperCard paper={paper} key={paper.id} />)}</div> : <div className="empty-state"><h2>暫時未有符合條件的試卷</h2><p>可以清除篩選，或稍後由Admin加入新內容。</p></div>}
      </div>
    </AppShell>
  );
}
