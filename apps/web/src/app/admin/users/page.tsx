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

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <AppShell activePath="/admin/users" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>會員管理</h1><p>查看家庭帳戶、孩子數量、訂閱及使用狀態。</p></div></header>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>會員</th><th>電郵</th><th>孩子檔案</th><th>計劃</th><th>狀態</th><th>建立日期</th></tr></thead><tbody>{users.map((user) => { const subscription = user.subscriptions[0]; const status = subscription ? subscriptionStatusLabels[subscription.status] : "未訂閱"; return <tr key={user.email}><td><strong>{user.displayName}</strong></td><td>{user.email}</td><td>{user._count.children}</td><td>{subscription?.providerPlanId ?? "免費帳戶"}</td><td><Badge tone={subscription?.status === "ACTIVE" ? "mint" : "sun"}>{status}</Badge></td><td>{new Intl.DateTimeFormat("zh-HK").format(user.createdAt)}</td></tr>; })}</tbody></table></div>
      </div>
    </AppShell>
  );
}
