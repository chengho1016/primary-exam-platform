import { describe, expect, it } from "vitest";
import { canSignInWithAccountStatus, getAccountStatusLoginMessage } from "./account-status";

describe("account status auth policy", () => {
  it("allows active accounts to sign in", () => {
    expect(canSignInWithAccountStatus("ACTIVE")).toBe(true);
    expect(getAccountStatusLoginMessage("ACTIVE")).toBeUndefined();
  });

  it("blocks disabled accounts", () => {
    expect(canSignInWithAccountStatus("DISABLED")).toBe(false);
    expect(getAccountStatusLoginMessage("DISABLED")).toBe("此帳戶已停用，請聯絡管理員重新啟用");
  });

  it("blocks blocked accounts", () => {
    expect(canSignInWithAccountStatus("BLOCKED")).toBe(false);
    expect(getAccountStatusLoginMessage("BLOCKED")).toBe("此帳戶已被封鎖，請聯絡管理員處理");
  });
});
