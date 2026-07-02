import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  backfillQuestionVersions: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/questions/version-backfill", () => ({
  backfillQuestionVersions: mocks.backfillQuestionVersions,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    adminAuditLog: { create: mocks.auditCreate },
  },
}));

describe("POST /api/admin/questions/backfill-versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mocks.backfillQuestionVersions.mockResolvedValue({
      questionsScanned: 47,
      versionsCreated: 47,
      versionsAlreadyPresent: 0,
    });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("rejects unauthenticated users", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("not admin"));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "請先登入管理員帳戶" });
    expect(mocks.backfillQuestionVersions).not.toHaveBeenCalled();
  });

  it("runs question version backfill and writes an admin audit log", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      stats: {
        questionsScanned: 47,
        versionsCreated: 47,
        versionsAlreadyPresent: 0,
      },
    });
    expect(mocks.backfillQuestionVersions).toHaveBeenCalledTimes(1);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        adminId: "admin-1",
        action: "question_versions.backfilled",
        entityType: "QuestionVersion",
        entityId: "all",
      }),
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/questions");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/database");
  });
});
