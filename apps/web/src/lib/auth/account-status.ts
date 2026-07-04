export type AccountStatus = "ACTIVE" | "DISABLED" | "BLOCKED";

export const accountStatusLabels: Record<AccountStatus, string> = {
  ACTIVE: "啟用",
  DISABLED: "停用",
  BLOCKED: "封鎖",
};

export function canSignInWithAccountStatus(status: AccountStatus) {
  return status === "ACTIVE";
}

export function getAccountStatusLoginMessage(status: AccountStatus) {
  if (status === "DISABLED") return "此帳戶已停用，請聯絡管理員重新啟用";
  if (status === "BLOCKED") return "此帳戶已被封鎖，請聯絡管理員處理";
  return undefined;
}
