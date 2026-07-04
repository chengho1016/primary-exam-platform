import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui";
import { deleteAdminUserAction, updateAdminUserAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { accountStatusLabels, type AccountStatus } from "@/lib/auth/account-status";
import { getAdminUserDetail } from "@/lib/admin/admin-repository";
import { getAdminUserForceDeleteBlockers } from "@/lib/admin/user-delete-policy";

export const metadata = { title: "編輯會員" };
export const dynamic = "force-dynamic";

const subscriptionStatusLabels = {
  NONE: "未訂閱",
  TRIAL: "免費試用",
  ACTIVE: "使用中",
  PAST_DUE: "付款待處理",
  CANCELLED: "已取消",
} as const;

function toDateTimeLocal(value?: Date | null) {
  if (!value) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function AdminUserEditPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const admin = await requireAdmin();
  const user = await getAdminUserDetail(userId);
  if (!user) notFound();

  const subscription = user.subscriptions[0];
  const deleteBlockers = getAdminUserForceDeleteBlockers({
    targetUserId: user.id,
    currentAdminId: admin.id,
  });
  const deleteBlockedReason = deleteBlockers.join("、");

  function getAccountStatusTone(status: AccountStatus) {
    if (status === "ACTIVE") return "mint" as const;
    if (status === "DISABLED") return "sun" as const;
    return "coral" as const;
  }

  return (
    <AppShell activePath="/admin/users" mode="admin">
      <div className="app-content">
        <header className="app-page-header">
          <div>
            <h1>編輯會員</h1>
            <p>更新會員基本資料、角色、會籍狀態、方案及列印額度。</p>
          </div>
          <Link className="button button-secondary" href="/admin/users">返回會員管理</Link>
        </header>

        <form action={updateAdminUserAction} className="edit-form admin-user-edit-form">
          <input name="userId" type="hidden" value={user.id} />

          <section className="form-panel">
            <h2>基本資料</h2>
            <p>這些資料會影響登入身份及後台權限。改電郵前要確認沒有重複帳戶。</p>
            <div className="field-row">
              <div className="field"><label htmlFor="displayName">會員名稱</label><input defaultValue={user.displayName} id="displayName" name="displayName" required /></div>
              <div className="field"><label htmlFor="email">電郵</label><input defaultValue={user.email} id="email" name="email" required type="email" /></div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="role">角色</label>
                <select defaultValue={user.role} id="role" name="role">
                  <option value="PARENT">家長</option>
                  <option value="ADMIN">管理員</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="accountStatus">帳戶狀態</label>
                <select defaultValue={user.accountStatus} id="accountStatus" name="accountStatus">
                  <option value="ACTIVE">啟用：可以登入</option>
                  <option value="DISABLED">停用：暫停登入</option>
                  <option value="BLOCKED">封鎖：阻止登入</option>
                </select>
                <p className="field-help">停用或封鎖後會清走該帳戶現有 session。</p>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>目前狀態</label>
                <div className="readonly-box"><Badge tone={getAccountStatusTone(user.accountStatus)}>{accountStatusLabels[user.accountStatus]}</Badge></div>
              </div>
              <div className="field">
                <label>目前資料</label>
                <div className="readonly-box">{user.children.length} 個孩子 · {user.entitlements.length} 份試卷權限 · {user.printJobs.length} 筆近期列印</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="newPassword">重設密碼</label>
                <input autoComplete="new-password" id="newPassword" minLength={6} name="newPassword" placeholder="留空即不更改" type="password" />
                <p className="field-help">如家長或管理員忘記密碼，可在此直接重設；留空會保留原密碼。</p>
              </div>
              <div className="field">
                <label>安全記錄</label>
                <div className="readonly-box">每次改角色、會籍或密碼都會寫入 AdminAuditLog。</div>
              </div>
            </div>
          </section>

          <section className="form-panel">
            <h2>會員／訂閱</h2>
            <p>可直接調整會員狀態、方案名稱、列印額度及有效期。選「未訂閱」會移除現有訂閱記錄。</p>
            <div className="field-row">
              <div className="field">
                <label htmlFor="membershipStatus">會籍狀態</label>
                <select defaultValue={subscription?.status ?? "NONE"} id="membershipStatus" name="membershipStatus">
                  {Object.entries(subscriptionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="providerPlanId">方案 ID／名稱</label><input defaultValue={subscription?.providerPlanId ?? ""} id="providerPlanId" name="providerPlanId" placeholder="例如 monthly-basic" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label htmlFor="printAllowance">列印額度</label><input defaultValue={subscription?.printAllowance ?? 0} id="printAllowance" min={0} name="printAllowance" type="number" /></div>
              <div className="field"><label>目前狀態</label><div className="readonly-box"><Badge tone={subscription?.status === "ACTIVE" ? "mint" : "sun"}>{subscriptionStatusLabels[subscription?.status ?? "NONE"]}</Badge></div></div>
            </div>
            <div className="field-row">
              <div className="field"><label htmlFor="periodStartsAt">開始時間</label><input defaultValue={toDateTimeLocal(subscription?.periodStartsAt)} id="periodStartsAt" name="periodStartsAt" type="datetime-local" /></div>
              <div className="field"><label htmlFor="periodEndsAt">到期時間</label><input defaultValue={toDateTimeLocal(subscription?.periodEndsAt)} id="periodEndsAt" name="periodEndsAt" type="datetime-local" /></div>
            </div>
          </section>

          <section className="form-panel">
            <h2>關聯資料</h2>
            <div className="admin-related-grid">
              <div>
                <h3>孩子檔案</h3>
                {user.children.length ? <ul>{user.children.map((child) => <li key={child.id}>{child.displayName} · 小{child.grade}</li>)}</ul> : <p className="row-muted">未建立孩子檔案</p>}
              </div>
              <div>
                <h3>試卷權限</h3>
                {user.entitlements.length ? <ul>{user.entitlements.slice(0, 6).map((entitlement) => <li key={entitlement.id}>{entitlement.paper.code} · 列印額度 {entitlement.printAllowance}</li>)}</ul> : <p className="row-muted">未有逐份試卷權限</p>}
              </div>
            </div>
          </section>

          <button className="button button-primary" type="submit">儲存會員資料</button>
        </form>

        <section className="form-panel admin-danger-zone">
          <div>
            <p className="eyebrow">Danger Zone</p>
            <h2>強制刪除會員帳戶</h2>
            <p>輸入指定強制刪除密碼後，可強制刪除會員資料：孩子、會籍、權限、列印紀錄及 session 會被清理；其建立的試卷／審計紀錄會重指派到目前管理員。不能刪除目前登入中的管理員。</p>
            {deleteBlockers.length ? <p className="warning-banner">暫時不可刪除：{deleteBlockedReason}</p> : null}
          </div>
          {deleteBlockers.length ? (
            <button className="button button-danger" disabled title={deleteBlockedReason} type="button">受保護，不能刪除</button>
          ) : (
            <form action={deleteAdminUserAction} className="danger-zone-delete-form">
              <input name="userId" type="hidden" value={user.id} />
              <div className="field">
                <label htmlFor="forceDeletePassword">強制刪除密碼</label>
                <input autoComplete="current-password" id="forceDeletePassword" name="adminPassword" placeholder="輸入強制刪除密碼" required type="password" />
              </div>
              <ConfirmSubmitButton
                className="button button-danger"
                confirmMessage={`確定要強制刪除會員「${user.displayName}」（${user.email}）？系統會清理其孩子、會籍、權限、列印紀錄及登入 session，而且不能復原。`}
              >
                強制刪除帳戶
              </ConfirmSubmitButton>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
