import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  transaction: vi.fn(),
  userUpsert: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    $transaction: mocks.transaction,
  },
}));

function request(payload: unknown) {
  return new Request("https://example.test/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mocks.userUpsert.mockResolvedValue({ id: "user-1", email: "sally@local.exam", displayName: "Sally", role: "ADMIN" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.transaction.mockImplementation(async (callback) => callback({
      user: { upsert: mocks.userUpsert },
      adminAuditLog: { create: mocks.auditCreate },
    }));
  });

  it("rejects unauthenticated users", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("not admin"));

    const response = await POST(request({ email: "sally@local.exam", displayName: "Sally", password: "60707627" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "請先登入管理員帳戶" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("validates email before saving", async () => {
    const response = await POST(request({ email: "Sally", displayName: "Sally", password: "60707627" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "請輸入有效電郵地址" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("upserts an admin user and writes an audit log", async () => {
    const response = await POST(request({ email: "Sally@LOCAL.EXAM", displayName: "Sally", password: "60707627", role: "ADMIN" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, user: { id: "user-1", email: "sally@local.exam", displayName: "Sally", role: "ADMIN" } });
    expect(mocks.userUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "sally@local.exam" },
      update: expect.objectContaining({ displayName: "Sally", role: "ADMIN" }),
      create: expect.objectContaining({ email: "sally@local.exam", displayName: "Sally", role: "ADMIN" }),
      select: { id: true, email: true, displayName: true, role: true },
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        adminId: "admin-1",
        action: "admin_user.upserted",
        entityType: "User",
        entityId: "user-1",
        metadata: { email: "sally@local.exam", displayName: "Sally", role: "ADMIN" },
      }),
    }));
  });
});
