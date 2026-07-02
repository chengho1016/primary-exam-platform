import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { createAdminUserAction } from "@/app/admin/actions";
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

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ updated?: string; created?: string }> }) {
  const filters = await searchParams;
  const users = await listAdminUsers();
  const activeMembers = users.filter((user) => user.subscriptions[0]?.status === "ACTIVE").length;
  const admins = users.filter((user) => user.role === "ADMIN").length;

  return (
    <AppShell activePath="/admin/users" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>會員管理</h1>
            <p>查看及編輯會員資料、角色、會籍狀態、方案及列印額度。</p>
          </div>
          <span className="badge badge-blue">共 {users.length} 個帳戶</span>
        </header>

        {filters.created === "1" ? <p className="success-banner">新帳戶已建立，可即時登入使用。</p> : null}
        {filters.updated === "1" ? <p className="success-banner">會員資料已更新。</p> : null}

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
          <div className="admin-stat tone-coral"><span>列印紀錄</span><strong>{users.reduce((sum, user) => sum + user._count.printJobs, 0)}</strong><small>所有會員累計</small></div>
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
                    <td><div className="row-actions"><Link href={`/admin/users/${user.id}/edit`}>編輯</Link></div></td>
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
