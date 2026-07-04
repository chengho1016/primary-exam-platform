import { describe, expect, it } from "vitest";
import {
  canDeleteAdminUser,
  canForceDeleteAdminUser,
  getAdminUserDeleteBlockers,
  getAdminUserForceDeleteBlockers,
  type AdminUserDeletePolicyInput,
} from "./user-delete-policy";

const baseInput: AdminUserDeletePolicyInput = {
  targetUserId: "user-1",
  currentAdminId: "admin-1",
  role: "PARENT",
  childrenCount: 0,
  entitlementsCount: 0,
  printJobsCount: 0,
  authoredPapersCount: 0,
  auditLogsCount: 0,
  latestSubscriptionStatus: "CANCELLED",
};

describe("admin user delete policy", () => {
  it("allows deleting an inactive parent account with no linked learning or operations data", () => {
    expect(canDeleteAdminUser(baseInput)).toBe(true);
    expect(getAdminUserDeleteBlockers(baseInput)).toEqual([]);
  });

  it("blocks self-deletion and admin accounts", () => {
    const blockers = getAdminUserDeleteBlockers({
      ...baseInput,
      targetUserId: "admin-1",
      role: "ADMIN",
    });

    expect(blockers).toContain("不能刪除目前登入中的管理員");
    expect(blockers).toContain("管理員帳戶請先降為家長，避免誤刪後台權限");
  });

  it("blocks accounts with active membership or historical records", () => {
    expect(getAdminUserDeleteBlockers({
      ...baseInput,
      latestSubscriptionStatus: "ACTIVE",
      childrenCount: 2,
      entitlementsCount: 1,
      printJobsCount: 3,
      auditLogsCount: 4,
    })).toEqual([
      "會籍仍在使用中",
      "2 個孩子檔案",
      "1 份試卷權限",
      "3 個列印紀錄",
      "4 筆後台操作紀錄",
    ]);
  });

  it("allows force-delete for historical accounts but still blocks the current admin", () => {
    expect(canForceDeleteAdminUser({ targetUserId: "user-1", currentAdminId: "admin-1" })).toBe(true);
    expect(getAdminUserForceDeleteBlockers({ targetUserId: "admin-1", currentAdminId: "admin-1" })).toEqual([
      "不能強制刪除目前登入中的管理員",
    ]);
  });
});
