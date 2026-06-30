import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  userFindUnique: vi.fn(),
  paperCreate: vi.fn(),
  adminAuditLogCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    paper: { create: mocks.paperCreate },
    adminAuditLog: { create: mocks.adminAuditLogCreate },
    $transaction: mocks.transaction,
  },
}));

function makeUploadRequest(overrides: Partial<Record<string, string>> = {}, file?: File) {
  const formData = new FormData();
  formData.set("code", overrides.code ?? "audit-001");
  formData.set("title", overrides.title ?? "Audit upload paper");
  formData.set("grade", overrides.grade ?? "4");
  formData.set("subject", overrides.subject ?? "數學");
  formData.set("academicYear", overrides.academicYear ?? "2025-2026");
  formData.set("access", overrides.access ?? "MEMBERSHIP");
  formData.set(
    "paperFile",
    file ?? new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "audit.pdf", { type: "application/pdf" }),
  );

  return new Request("https://example.test/api/admin/papers", { method: "POST", body: formData });
}

describe("POST /api/admin/papers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "current-admin", role: "ADMIN" });
    mocks.userFindUnique.mockResolvedValue({ id: "seed-admin-id" });
    mocks.paperCreate.mockImplementation((args) => ({ model: "paper", args }));
    mocks.adminAuditLogCreate.mockImplementation((args) => ({ model: "adminAuditLog", args }));
    mocks.transaction.mockResolvedValue([]);
  });

  it("rejects unauthenticated users before parsing or saving", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("not authenticated"));

    const response = await POST(makeUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "請先登入管理員帳戶" });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("validates required paper file", async () => {
    const formData = new FormData();
    formData.set("code", "audit-002");
    formData.set("title", "Missing file paper");
    formData.set("grade", "4");
    formData.set("subject", "數學");
    formData.set("access", "MEMBERSHIP");

    const response = await POST(new Request("https://example.test/api/admin/papers", { method: "POST", body: formData }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "請選擇試卷檔案" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("stores uploaded PDF as base64 data URI and writes an audit log", async () => {
    const response = await POST(makeUploadRequest({ code: "audit-003", title: "Uploaded PDF" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.paperId).toEqual(expect.any(String));
    expect(body.redirect).toBe(`/admin/papers/${body.paperId}/edit`);

    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { email: "admin@local.exam" }, select: { id: true } });
    expect(mocks.paperCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: body.paperId,
          code: "AUDIT-003",
          title: "Uploaded PDF",
          grade: 4,
          subject: "數學",
          academicYear: "2025-2026",
          access: "MEMBERSHIP",
          status: "DRAFT",
          createdById: "seed-admin-id",
          sourceAssetPath: "data:application/pdf;base64,JVBERg==",
        }),
      }),
    );
    expect(mocks.adminAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "seed-admin-id",
          action: "paper.created",
          entityType: "Paper",
          entityId: body.paperId,
          metadata: { code: "AUDIT-003", filename: "audit.pdf" },
        }),
      }),
    );
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
