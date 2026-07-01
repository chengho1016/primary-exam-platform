import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deletePaperAction, updatePaperStatusAction } from "@/app/admin/actions";
import type { PaperStatus } from "@/generated/prisma/client";
import { listAdminPapers } from "@/lib/admin/admin-repository";
import { formatPaperAccess, formatPaperStatus } from "@/lib/admin/presentation";

export const metadata = { title: "試卷管理" };
export const dynamic = "force-dynamic";

const validStatuses = new Set<PaperStatus>(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

type AdminPaper = Awaited<ReturnType<typeof listAdminPapers>>[number];

function getNextStatus(status: PaperStatus): { label: string; value: PaperStatus } {
  if (status === "DRAFT") return { label: "送交覆核", value: "REVIEW" };
  if (status === "REVIEW") return { label: "發布", value: "PUBLISHED" };
  if (status === "PUBLISHED") return { label: "下架", value: "ARCHIVED" };
  return { label: "回復草稿", value: "DRAFT" };
}

function getAssetState(paper: AdminPaper) {
  const hasUploadedSource = Boolean(paper.sourceAssetPath);
  const hasPreparedPrintAsset = Boolean(paper.printablePdfPath);
  if (hasPreparedPrintAsset && hasUploadedSource) return { label: "PDF + 列印檔", tone: "good" as const };
  if (hasPreparedPrintAsset) return { label: "列印檔", tone: "good" as const };
  if (hasUploadedSource) return { label: "已上傳PDF", tone: "good" as const };
  return { label: "未有PDF", tone: "warn" as const };
}

function getPrintState(paper: AdminPaper) {
  if (paper.printablePdfPath || paper.sourceAssetPath) return { label: "可列印", tone: "good" as const };
  return { label: "不可列印", tone: "bad" as const };
}

function getPracticeState(paper: AdminPaper) {
  const verifiedPracticeCount = paper.questions.filter(
    (question) => question.onlineEligible && question.reviewStatus.startsWith("verified"),
  ).length;

  if (verifiedPracticeCount >= 15) return { label: `可練習 ${verifiedPracticeCount}題`, tone: "good" as const };
  if (paper._count.questions === 0) return { label: "未入題", tone: "muted" as const };
  return { label: `不足 ${verifiedPracticeCount}/15`, tone: "warn" as const };
}

function getNextStep(paper: AdminPaper) {
  const asset = getAssetState(paper);
  const practice = getPracticeState(paper);

  if (asset.tone !== "good") return "先上傳PDF";
  if (paper.status === "DRAFT") return "送交覆核";
  if (paper.status === "REVIEW") return "覆核後發布";
  if (paper.status === "PUBLISHED" && practice.tone === "good") return "前台可用";
  if (paper.status === "PUBLISHED") return "可列印，待補題庫";
  return "已下架";
}

function StatusPill({ label, tone }: { label: string; tone: "good" | "warn" | "bad" | "muted" }) {
  return <span className={`admin-status-pill admin-status-${tone}`}>{label}</span>;
}

function getDeleteBlockReason(paper: AdminPaper) {
  const blockers: string[] = [];
  if (paper._count.attempts > 0) blockers.push(`${paper._count.attempts} 個練習紀錄`);
  if (paper._count.printJobs > 0) blockers.push(`${paper._count.printJobs} 個列印紀錄`);
  if (paper._count.entitlements > 0) blockers.push(`${paper._count.entitlements} 個會員權限`);
  return blockers.length ? blockers.join("、") : null;
}

export default async function AdminPapersPage({ searchParams }: { searchParams: Promise<{ query?: string; status?: string; created?: string; updated?: string; deleted?: string; deleteBlocked?: string; paper?: string; reason?: string }> }) {
  const filters = await searchParams;
  const status = filters.status && validStatuses.has(filters.status as PaperStatus) ? filters.status as PaperStatus : undefined;
  const papers = await listAdminPapers({ query: filters.query?.trim(), status });

  return (
    <AppShell activePath="/admin/papers" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>試卷管理</h1>
            <p>上傳、覆核、發布、下架及檢查 PDF／列印／練習狀態。</p>
          </div>
          <ButtonLink href="/admin/papers/new">＋ 上傳試卷</ButtonLink>
        </header>

        {filters.created === "1" ? <p className="success-banner">試卷已安全上傳並儲存為草稿。</p> : filters.updated === "1" ? <p className="success-banner">試卷資料已更新。</p> : filters.deleted === "1" ? <p className="success-banner">試卷已刪除，相關題目亦已從題庫移除。</p> : null}
        {filters.deleteBlocked === "1" ? (
          <p className="warning-banner">
            {filters.paper ? `${filters.paper} 暫時不可刪除` : "試卷暫時不可刪除"}：{filters.reason === "not-found" ? "找不到試卷" : filters.reason || "已有使用紀錄"}。如要隱藏前台，請先改為「下架」。
          </p>
        ) : null}

        <form className="filter-bar" method="get">
          <div className="field"><label htmlFor="admin-search">搜尋</label><input defaultValue={filters.query} id="admin-search" name="query" placeholder="試卷名稱或編號" /></div>
          <div className="field"><label htmlFor="admin-status">狀態</label><select defaultValue={status ?? ""} id="admin-status" name="status"><option value="">全部狀態</option><option value="DRAFT">草稿</option><option value="REVIEW">覆核中</option><option value="PUBLISHED">已發布</option><option value="ARCHIVED">已下架</option></select></div>
          <button className="button button-secondary button-small" type="submit">搜尋</button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table admin-paper-table">
            <thead>
              <tr>
                <th>試卷</th>
                <th>年級／科目</th>
                <th>內容狀態</th>
                <th>題庫／練習</th>
                <th>存取方式</th>
                <th>發布狀態</th>
                <th>下一步</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => {
                const nextStatus = getNextStatus(paper.status);
                const assetState = getAssetState(paper);
                const printState = getPrintState(paper);
                const practiceState = getPracticeState(paper);
                const deleteBlockReason = getDeleteBlockReason(paper);

                return (
                  <tr key={paper.id}>
                    <td className="admin-paper-title-cell">
                      <strong>{paper.title}</strong>
                      <small>{paper.code} · {paper.academicYear ?? "未設定學年"}</small>
                    </td>
                    <td>小{paper.grade}／{paper.subject}</td>
                    <td><div className="admin-status-stack"><StatusPill {...assetState} /><StatusPill {...printState} /></div></td>
                    <td><div className="admin-status-stack"><span>{paper._count.questions}題</span><StatusPill {...practiceState} /></div></td>
                    <td>{formatPaperAccess(paper.access, paper.priceInCents)}</td>
                    <td><span className={`status-dot status-${paper.status.toLowerCase()}`}>{formatPaperStatus(paper.status)}</span></td>
                    <td className="admin-next-step">{getNextStep(paper)}</td>
                    <td>
                      <div className="row-actions">
                        {paper.status === "PUBLISHED" ? <Link href={`/papers/${paper.id}`}>前台</Link> : <span className="row-muted">未發布</span>}
                        <Link href={`/admin/papers/${paper.id}/edit`}>編輯</Link>
                        <Link href={`/admin/questions?subject=${encodeURIComponent(paper.subject)}&paper=${encodeURIComponent(paper.code)}`}>題目</Link>
                        <form action={updatePaperStatusAction}>
                          <input name="paperId" type="hidden" value={paper.id} />
                          <input name="status" type="hidden" value={nextStatus.value} />
                          <button type="submit">{nextStatus.label}</button>
                        </form>
                        {deleteBlockReason ? (
                          <span className="row-muted" title={`已有${deleteBlockReason}，不可直接刪除`}>不可刪除</span>
                        ) : (
                          <form action={deletePaperAction}>
                            <input name="paperId" type="hidden" value={paper.id} />
                            <ConfirmSubmitButton
                              className="danger-action"
                              confirmMessage={`確定要刪除「${paper.title}」（${paper.code}）？這會同時刪除 ${paper._count.questions} 條題目，而且不能復原。`}
                            >
                              刪除
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
