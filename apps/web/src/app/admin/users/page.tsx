import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
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

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
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

        {filters.updated === "1" ? <p className="success-banner">會員資料已更新。</p> : null}

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
                  <tr key={user.id}>
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
