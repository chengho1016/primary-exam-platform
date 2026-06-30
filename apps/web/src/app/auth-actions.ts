"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";

export interface AuthActionState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("請輸入有效電郵地址"),
  password: z.string().min(1, "請輸入密碼"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "請輸入家長稱呼").max(50),
  email: z.string().trim().toLowerCase().email("請輸入有效電郵地址"),
  childName: z.string().trim().min(1, "請輸入小朋友名稱").max(50),
  grade: z.coerce.number().int().min(1).max(6),
  password: z.string().min(8, "密碼最少需要8個字元").regex(/[A-Za-z]/, "密碼需要包含英文字母").regex(/[0-9]/, "密碼需要包含數字"),
});

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedCredentials = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsedCredentials.success) return { error: parsedCredentials.error.issues[0]?.message };

  const user = await db.user.findUnique({ where: { email: parsedCredentials.data.email } });
  const isValidPassword = user
    ? await verifyPassword(parsedCredentials.data.password, user.passwordHash)
    : false;

  if (!user || !isValidPassword) return { error: "電郵地址或密碼不正確" };

  await db.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedAccount = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsedAccount.success) return { error: parsedAccount.error.issues[0]?.message };

  try {
    const passwordHash = await hashPassword(parsedAccount.data.password);
    const user = await db.user.create({
      data: {
        email: parsedAccount.data.email,
        displayName: parsedAccount.data.name,
        passwordHash,
        children: {
          create: { displayName: parsedAccount.data.childName, grade: parsedAccount.data.grade },
        },
      },
    });
    await createSession(user.id);
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "此電郵地址已經註冊" };
    console.error("Failed to register account.", error);
    return { error: "未能建立帳戶，請稍後再試" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
