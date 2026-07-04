import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createAdminUserAction, deleteAdminUserAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { accountStatusLabels, type AccountStatus } from "@/lib/auth/account-status";
import { listAdminUsers } from "@/lib/admin/admin-repository";

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

function getAccountStatusTone(status: AccountStatus) {
  if (status === "ACTIVE") return "mint" as const;
  if (status === "DISABLED") return "sun" as const;
  return "coral" as const;
}

function formatDeleteReason(reason?: string) {
  if (reason === "not-found") return "找不到會員";
  if (reason === "admin-password-invalid") return "管理員密碼不正確，未有刪除任何資料";
  return reason || "已有使用紀錄";
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
  const unavailableAccounts = users.filter((user) => user.accountStatus !== "ACTIVE").length;
  const forceDeleteCandidates = users.filter((user) => user.id !== admin.id).length;

  return (
    <AppShell activePath="/admin/users" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>會員管理</h1>
            <p>查看、停用、封鎖或強制刪除會員帳戶；強制刪除必須輸入指定刪除密碼。</p>
          </div>
          <span className="badge badge-blue">共 {users.length} 個帳戶</span>
        </header>

        {filters.created === "1" ? <p className="success-banner">新帳戶已建立，可即時登入使用。</p> : null}
        {filters.updated === "1" ? <p className="success-banner">會員資料已更新。</p> : null}
        {filters.deleted === "1" ? <p className="success-banner">會員帳戶已強制刪除，相關會員資料已清理並寫入 AdminAuditLog。</p> : null}
        {filters.deleteBlocked === "1" ? (
          <p className="warning-banner">
            {filters.user ? `${filters.user} 暫時不可刪除` : "會員帳戶暫時不可刪除"}：{formatDeleteReason(filters.reason)}。
          </p>
        ) : null}

        <section className="form-panel admin-guidance-panel admin-user-create-panel">
          <div className="panel-header"><h3>快速新增帳戶</h3><span>商業化必備：不用再靠工程師改密碼或開 Admin</span></div>
          <p>可直接建立管理員或家長帳戶；密碼會即時 bcrypt hash 後儲存，並寫入 AdminAuditLog。新增後可在下方列表再編輯會籍、額度、角色及帳戶狀態。</p>
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
          <div className="admin-stat tone-sun"><span>停用／封鎖</span><strong>{unavailableAccounts}</strong><small>不能登入的帳戶</small></div>
          <div className="admin-stat tone-coral"><span>可強制刪除</span><strong>{forceDeleteCandidates}</strong><small>除目前登入 Admin 外</small></div>
        </section>

        <section className="admin-safety-note" aria-label="強制刪除會員安全規則">
          <strong>強制刪除安全線：</strong>
          <span>必須輸入指定強制刪除密碼；系統會刪除該會員的孩子、會籍、權限、列印紀錄及 session，並把其建立的試卷／後台審計紀錄重指派到目前管理員。不能刪除目前登入中的管理員。</span>
        </section>

        <div className="admin-table-wrap">
          <table className="admin-table admin-user-table">
            <thead>
              <tr>
                <th>會員</th>
                <th>角色</th>
                <th>帳戶狀態</th>
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
                const isCurrentAdmin = user.id === admin.id;

                return (
                  <tr id={`user-${user.id}`} key={user.id}>
                    <td className="admin-paper-title-cell">
                      <strong>{user.displayName}</strong>
                      <small>{user.email}</small>
                    </td>
                    <td><Badge tone={user.role === "ADMIN" ? "coral" : "blue"}>{user.role === "ADMIN" ? "管理員" : "家長"}</Badge></td>
                    <td><Badge tone={getAccountStatusTone(user.accountStatus)}>{accountStatusLabels[user.accountStatus]}</Badge></td>
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
                      <div className="row-actions admin-user-actions force-delete-actions">
                        <Link href={`/admin/users/${user.id}/edit`}>編輯</Link>
                        {isCurrentAdmin ? (
                          <>
                            <button className="danger-action" disabled title="不能刪除目前登入中的管理員" type="button">強制刪除</button>
                            <span className="row-muted">目前帳戶</span>
                          </>
                        ) : (
                          <form action={deleteAdminUserAction} className="force-delete-form">
                            <input name="userId" type="hidden" value={user.id} />
                            <input
                              aria-label={`輸入強制刪除密碼以刪除 ${user.displayName}`}
                              autoComplete="current-password"
                              name="adminPassword"
                              placeholder="強制刪除密碼"
                              required
                              type="password"
                            />
                            <ConfirmSubmitButton
                              className="danger-action"
                              confirmMessage={`確定要強制刪除會員「${user.displayName}」（${user.email}）？系統會清理其孩子、會籍、權限、列印紀錄及登入 session，而且不能復原。`}
                            >
                              強制刪除
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
