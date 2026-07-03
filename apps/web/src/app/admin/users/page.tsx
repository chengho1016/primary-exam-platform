import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createAdminUserAction, deleteAdminUserAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { listAdminUsers } from "@/lib/admin/admin-repository";
import { getAdminUserDeleteBlockers } from "@/lib/admin/user-delete-policy";

export const metadata = { title: "會員管理" };
export const dynamic = "force-dynamic";

const subscriptionStatusLabels = {
  TRIAL: "免費試用",
  ACTIVE: "使用中",
  PAST_DUE: "付款待處理",
  CANCELLED: "已取消",
} as const;

function getSubscriptionTone(status?: keyof typeof subscriptionStatusLabels) {
  if (status === "ACTIVE") return "mint" as const;
  if (status === "PAST_DUE" || status === "CANCELLED") return "coral" as const;
  return "sun" as const;
}

type AdminUser = Awaited<ReturnType<typeof listAdminUsers>>[number];

function getDeleteBlockers(user: AdminUser, currentAdminId: string) {
  return getAdminUserDeleteBlockers({
    targetUserId: user.id,
    currentAdminId,
    role: user.role,
    childrenCount: user._count.children,
    entitlementsCount: user._count.entitlements,
    printJobsCount: user._count.printJobs,
    authoredPapersCount: user._count.authoredPapers,
    auditLogsCount: user._count.auditLogs,
    latestSubscriptionStatus: user.subscriptions[0]?.status,
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    created?: string;
    deleted?: string;
    deleteBlocked?: string;
    user?: string;
    reason?: string;
  }>;
}) {
  const filters = await searchParams;
  const admin = await requireAdmin();
  const users = await listAdminUsers();
  const activeMembers = users.filter((user) => user.subscriptions[0]?.status === "ACTIVE").length;
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const safeDeleteCandidates = users.filter((user) => getDeleteBlockers(user, admin.id).length === 0).length;

  return (
    <AppShell activePath="/admin/users" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>會員管理</h1>
            <p>查看及編輯會員資料、角色、會籍狀態、方案、列印額度；亦可安全刪除未使用帳戶。</p>
          </div>
          <span className="badge badge-blue">共 {users.length} 個帳戶</span>
        </header>

        {filters.created === "1" ? <p className="success-banner">新帳戶已建立，可即時登入使用。</p> : null}
        {filters.updated === "1" ? <p className="success-banner">會員資料已更新。</p> : null}
        {filters.deleted === "1" ? <p className="success-banner">會員帳戶已刪除，並已寫入 AdminAuditLog。</p> : null}
        {filters.deleteBlocked === "1" ? (
          <p className="warning-banner">
            {filters.user ? `${filters.user} 暫時不可刪除` : "會員帳戶暫時不可刪除"}：{filters.reason === "not-found" ? "找不到會員" : filters.reason || "已有使用紀錄"}。
          </p>
        ) : null}

        <section className="form-panel admin-guidance-panel admin-user-create-panel">
          <div className="panel-header"><h3>快速新增帳戶</h3><span>商業化必備：不用再靠工程師改密碼或開 Admin</span></div>
          <p>可直接建立管理員或家長帳戶；密碼會即時 bcrypt hash 後儲存，並寫入 AdminAuditLog。新增後可在下方列表再編輯會籍、額度及角色。</p>
          <form action={createAdminUserAction} className="admin-inline-form">
            <div className="field-row three-columns">
              <div className="field"><label htmlFor="newDisplayName">名稱</label><input id="newDisplayName" name="displayName" placeholder="例如 Sally" required /></div>
              <div className="field"><label htmlFor="newEmail">登入 Email</label><input id="newEmail" name="email" placeholder="name@example.com" required type="email" /></div>
              <div className="field"><label htmlFor="newPassword">初始密碼</label><input autoComplete="new-password" id="newPassword" minLength={6} name="password" required type="password" /></div>
            </div>
            <div className="field-row four-columns">
              <div className="field"><label htmlFor="newRole">角色</label><select defaultValue="ADMIN" id="newRole" name="role"><option value="PARENT">家長</option><option value="ADMIN">管理員</option></select></div>
              <div className="field"><label htmlFor="newMembershipStatus">會籍</label><select defaultValue="NONE" id="newMembershipStatus" name="membershipStatus"><option value="NONE">未訂閱</option><option value="TRIAL">免費試用</option><option value="ACTIVE">使用中</option></select></div>
              <div className="field"><label htmlFor="newProviderPlanId">方案</label><input id="newProviderPlanId" name="providerPlanId" placeholder="monthly-basic / admin" /></div>
              <div className="field"><label htmlFor="newPrintAllowance">列印額度</label><input defaultValue={0} id="newPrintAllowance" min={0} name="printAllowance" type="number" /></div>
            </div>
            <button className="button button-primary" type="submit">建立帳戶</button>
          </form>
        </section>

        <section className="admin-grid admin-question-metrics" aria-label="會員概覽">
          <div className="admin-stat tone-blue"><span>全部帳戶</span><strong>{users.length}</strong><small>包括家長及管理員</small></div>
          <div className="admin-stat tone-mint"><span>Active 會員</span><strong>{activeMembers}</strong><small>目前使用中會籍</small></div>
          <div className="admin-stat tone-sun"><span>管理員</span><strong>{admins}</strong><small>具後台權限</small></div>
          <div className="admin-stat tone-coral"><span>可安全刪除</span><strong>{safeDeleteCandidates}</strong><small>無孩子／權限／紀錄的帳戶</small></div>
        </section>

        <section className="admin-safety-note" aria-label="刪除會員安全規則">
          <strong>刪除安全線：</strong>
          <span>只容許刪除未有孩子檔案、試卷權限、列印紀錄、後台操作紀錄，而且不是管理員／使用中會籍的帳戶。已有紀錄的帳戶請先改會籍或保留作審計。</span>
        </section>

        <div className="admin-table-wrap">
          <table className="admin-table admin-user-table">
            <thead>
              <tr>
                <th>會員</th>
                <th>角色</th>
                <th>孩子／權限</th>
                <th>計劃</th>
                <th>會籍狀態</th>
                <th>列印額度</th>
                <th>建立日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const subscription = user.subscriptions[0];
                const status = subscription ? subscriptionStatusLabels[subscription.status] : "未訂閱";
                const deleteBlockers = getDeleteBlockers(user, admin.id);
                const deleteBlockedReason = deleteBlockers.join("、");

                return (
                  <tr id={`user-${user.id}`} key={user.id}>
                    <td className="admin-paper-title-cell">
                      <strong>{user.displayName}</strong>
                      <small>{user.email}</small>
                    </td>
                    <td><Badge tone={user.role === "ADMIN" ? "coral" : "blue"}>{user.role === "ADMIN" ? "管理員" : "家長"}</Badge></td>
                    <td>
                      <div className="admin-status-stack">
                        <span>{user._count.children} 個孩子</span>
                        <span>{user._count.entitlements} 份試卷權限</span>
                      </div>
                    </td>
                    <td>{subscription?.providerPlanId ?? "免費帳戶"}</td>
                    <td><Badge tone={getSubscriptionTone(subscription?.status)}>{status}</Badge></td>
                    <td>{subscription?.printAllowance ?? 0}</td>
                    <td>{new Intl.DateTimeFormat("zh-HK").format(user.createdAt)}</td>
                    <td>
                      <div className="row-actions admin-user-actions">
                        <Link href={`/admin/users/${user.id}/edit`}>編輯</Link>
                        {deleteBlockers.length ? (
                          <button className="danger-action" disabled title={deleteBlockedReason} type="button">刪除</button>
                        ) : (
                          <form action={deleteAdminUserAction}>
                            <input name="userId" type="hidden" value={user.id} />
                            <ConfirmSubmitButton
                              className="danger-action"
                              confirmMessage={`確定要刪除會員「${user.displayName}」（${user.email}）？此操作會移除登入 session / 會籍資料，而且不能復原。`}
                            >
                              刪除
                            </ConfirmSubmitButton>
                          </form>
                        )}
                        {deleteBlockers.length ? <span className="row-muted">受保護</span> : <span className="row-muted">可刪</span>}
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
