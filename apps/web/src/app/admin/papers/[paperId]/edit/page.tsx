import { notFound } from "next/navigation";
import { updatePaperAction } from "@/app/admin/actions";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db/prisma";

export const metadata = { title: "編輯試卷" };

export default async function EditPaperPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await db.paper.findUnique({ where: { id: paperId } });
  if (!paper) notFound();

  return (
    <AppShell activePath="/admin/papers" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>編輯試卷資料</h1><p>{paper.code} · 修改後會記錄在Admin審計紀錄。</p></div></header>
        <form action={updatePaperAction} className="form-panel edit-form">
          <input name="paperId" type="hidden" value={paper.id} />
          <div className="field-row"><div className="field"><label htmlFor="edit-code">試卷編號</label><input defaultValue={paper.code} id="edit-code" name="code" required /></div><div className="field"><label htmlFor="edit-year">學年</label><input defaultValue={paper.academicYear ?? ""} id="edit-year" name="academicYear" /></div></div>
          <div className="field"><label htmlFor="edit-title">試卷名稱</label><input defaultValue={paper.title} id="edit-title" name="title" required /></div>
          <div className="field-row"><div className="field"><label htmlFor="edit-grade">年級</label><select defaultValue={paper.grade} id="edit-grade" name="grade">{[1,2,3,4,5,6].map((grade) => <option key={grade} value={grade}>小{grade}</option>)}</select></div><div className="field"><label htmlFor="edit-subject">科目</label><select defaultValue={paper.subject} id="edit-subject" name="subject"><option>中文</option><option>英文</option><option>數學</option><option>人文</option><option>科學</option></select></div></div>
          <div className="field-row"><div className="field"><label htmlFor="edit-access">會員存取</label><select defaultValue={paper.access} id="edit-access" name="access"><option value="FREE">免費試用</option><option value="MEMBERSHIP">月費會員</option><option value="PURCHASE">逐份購買</option></select></div><div className="field"><label htmlFor="edit-duration">建議時間（分鐘）</label><input defaultValue={paper.durationMinutes} id="edit-duration" min="1" name="durationMinutes" type="number" /></div></div>
          <button className="button button-primary" type="submit">儲存試卷資料</button>
        </form>
      </div>
    </AppShell>
  );
}
