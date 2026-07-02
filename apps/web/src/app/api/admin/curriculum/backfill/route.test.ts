import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  backfillCurriculumTaxonomy: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/curriculum/backfill", () => ({
  backfillCurriculumTaxonomy: mocks.backfillCurriculumTaxonomy,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    adminAuditLog: { create: mocks.auditCreate },
  },
}));

describe("POST /api/admin/curriculum/backfill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mocks.backfillCurriculumTaxonomy.mockResolvedValue({
      papersLinked: 2,
      questionsLinked: 47,
      topicsCreatedOrUpdated: 47,
      knowledgePointsCreatedOrUpdated: 47,
      unmappedPapers: [],
    });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("rejects unauthenticated users", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("not admin"));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "請先登入管理員帳戶" });
    expect(mocks.backfillCurriculumTaxonomy).not.toHaveBeenCalled();
  });

  it("runs taxonomy backfill and writes an admin audit log", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      stats: {
        papersLinked: 2,
        questionsLinked: 47,
        topicsCreatedOrUpdated: 47,
        knowledgePointsCreatedOrUpdated: 47,
        unmappedPapers: [],
      },
    });
    expect(mocks.backfillCurriculumTaxonomy).toHaveBeenCalledTimes(1);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        adminId: "admin-1",
        action: "curriculum.backfilled",
        entityType: "Curriculum",
        entityId: "hk-primary",
      }),
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/curriculum");
  });
});
