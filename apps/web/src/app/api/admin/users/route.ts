import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

const adminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("請輸入有效電郵地址"),
  displayName: z.string().trim().min(1, "請輸入會員名稱").max(80),
  password: z.string().min(6, "密碼最少需要6個字元").max(128),
  role: z.enum(["PARENT", "ADMIN"]).default("ADMIN"),
});

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function POST(request: Request) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "請先登入管理員帳戶" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "請提供JSON資料" }, { status: 400 });
  }

  const parsed = adminUserSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "會員資料不完整" }, { status: 400 });
  }

  const userId = randomUUID();
  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const user = await db.$transaction(async (tx) => {
      const savedUser = await tx.user.upsert({
        where: { email: parsed.data.email },
        update: {
          displayName: parsed.data.displayName,
          passwordHash,
          role: parsed.data.role,
        },
        create: {
          id: userId,
          email: parsed.data.email,
          displayName: parsed.data.displayName,
          passwordHash,
          role: parsed.data.role,
        },
        select: { id: true, email: true, displayName: true, role: true },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "admin_user.upserted",
          entityType: "User",
          entityId: savedUser.id,
          metadata: { email: savedUser.email, displayName: savedUser.displayName, role: savedUser.role },
        },
      });

      return savedUser;
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "此電郵地址已經註冊" }, { status: 409 });
    }
    console.error("Failed to create or update admin user.", error);
    return NextResponse.json({ error: "未能儲存會員" }, { status: 500 });
  }
}
