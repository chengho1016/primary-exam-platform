export type AdminUserDeletePolicyInput = {
  targetUserId: string;
  currentAdminId: string;
  role: "PARENT" | "ADMIN";
  childrenCount: number;
  entitlementsCount: number;
  printJobsCount: number;
  authoredPapersCount: number;
  auditLogsCount: number;
  latestSubscriptionStatus?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | null;
};

export function getAdminUserDeleteBlockers(input: AdminUserDeletePolicyInput) {
  const blockers: string[] = [];

  if (input.targetUserId === input.currentAdminId) {
    blockers.push("不能刪除目前登入中的管理員");
  }

  if (input.role === "ADMIN") {
    blockers.push("管理員帳戶請先降為家長，避免誤刪後台權限");
  }

  if (input.latestSubscriptionStatus === "ACTIVE") {
    blockers.push("會籍仍在使用中");
  }

  if (input.latestSubscriptionStatus === "PAST_DUE") {
    blockers.push("付款狀態待處理");
  }

  if (input.childrenCount > 0) blockers.push(`${input.childrenCount} 個孩子檔案`);
  if (input.entitlementsCount > 0) blockers.push(`${input.entitlementsCount} 份試卷權限`);
  if (input.printJobsCount > 0) blockers.push(`${input.printJobsCount} 個列印紀錄`);
  if (input.authoredPapersCount > 0) blockers.push(`${input.authoredPapersCount} 份由此帳戶建立的試卷`);
  if (input.auditLogsCount > 0) blockers.push(`${input.auditLogsCount} 筆後台操作紀錄`);

  return blockers;
}

export function canDeleteAdminUser(input: AdminUserDeletePolicyInput) {
  return getAdminUserDeleteBlockers(input).length === 0;
}

export function getAdminUserForceDeleteBlockers(input: Pick<AdminUserDeletePolicyInput, "targetUserId" | "currentAdminId">) {
  if (input.targetUserId === input.currentAdminId) {
    return ["不能強制刪除目前登入中的管理員"];
  }
  return [];
}

export function canForceDeleteAdminUser(input: Pick<AdminUserDeletePolicyInput, "targetUserId" | "currentAdminId">) {
  return getAdminUserForceDeleteBlockers(input).length === 0;
}
