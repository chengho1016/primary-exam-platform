import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/ui";
import { updatePaperStatusAction } from "@/app/admin/actions";
import type { PaperStatus } from "@/generated/prisma/client";
import { listAdminPapers } from "@/lib/admin/admin-repository";
import { formatPaperAccess, formatPaperStatus } from "@/lib/admin/presentation";

export const metadata = { title: "試卷管理" };
export const dynamic = "force-dynamic";

const validStatuses = new Set<PaperStatus>(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

function getNextStatus(status: PaperStatus): { label: string; value: PaperStatus } {
  if (status === "DRAFT") return { label: "送交覆核", value: "REVIEW" };
  if (status === "REVIEW") return { label: "發布", value: "PUBLISHED" };
  if (status === "PUBLISHED") return { label: "下架", value: "ARCHIVED" };
  return { label: "回復草稿", value: "DRAFT" };
}

export default async function AdminPapersPage({ searchParams }: { searchParams: Promise<{ query?: string; status?: string; created?: string; updated?: string }> }) {
  const filters = await searchParams;
  const status = filters.status && validStatuses.has(filters.status as PaperStatus) ? filters.status as PaperStatus : undefined;
  const papers = await listAdminPapers({ query: filters.query?.trim(), status });

  return (
    <AppShell activePath="/admin/papers" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>試卷管理</h1><p>上傳、覆核、發布、下架及設定列印權限。</p></div><ButtonLink href="/admin/papers/new">＋ 上傳試卷</ButtonLink></header>
        {filters.created === "1" ? <p className="success-banner">試卷已安全上傳並儲存為草稿。</p> : filters.updated === "1" ? <p className="success-banner">試卷資料已更新。</p> : null}
        <form className="filter-bar" method="get"><div className="field"><label htmlFor="admin-search">搜尋</label><input defaultValue={filters.query} id="admin-search" name="query" placeholder="試卷名稱或編號" /></div><div className="field"><label htmlFor="admin-status">狀態</label><select defaultValue={status ?? ""} id="admin-status" name="status"><option value="">全部狀態</option><option value="DRAFT">草稿</option><option value="REVIEW">覆核中</option><option value="PUBLISHED">已發布</option><option value="ARCHIVED">已下架</option></select></div><button className="button button-secondary button-small" type="submit">搜尋</button></form>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>試卷</th><th>年級／科目</th><th>題目</th><th>存取方式</th><th>狀態</th><th>操作</th></tr></thead><tbody>{papers.map((paper) => { const nextStatus = getNextStatus(paper.status); return <tr key={paper.id}><td><strong>{paper.title}</strong><br/><small>{paper.code} · {paper.academicYear ?? "未設定學年"}</small></td><td>小{paper.grade}／{paper.subject}</td><td>{paper._count.questions}題</td><td>{formatPaperAccess(paper.access, paper.priceInCents)}</td><td><span className={`status-dot ${paper.status === "DRAFT" ? "status-draft" : ""}`}>{formatPaperStatus(paper.status)}</span></td><td><div className="row-actions">{paper._count.questions > 0 ? <Link href={`/papers/${paper.id}`}>預覽</Link> : <span className="row-muted">待辨識</span>}<Link href={`/admin/papers/${paper.id}/edit`}>編輯</Link><Link href={`/admin/questions?paper=${paper.code}`}>題目</Link><form action={updatePaperStatusAction}><input name="paperId" type="hidden" value={paper.id} /><input name="status" type="hidden" value={nextStatus.value} /><button type="submit">{nextStatus.label}</button></form></div></td></tr>; })}</tbody></table></div>
      </div>
    </AppShell>
  );
}
