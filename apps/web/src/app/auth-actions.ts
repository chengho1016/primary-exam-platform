"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { canSignInWithAccountStatus, getAccountStatusLoginMessage } from "@/lib/auth/account-status";
import { normalizePhoneNumber } from "@/lib/auth/phone";

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
  phoneNumber: z.string()
    .trim()
    .min(1, "請輸入電話號碼")
    .refine((value) => Boolean(normalizePhoneNumber(value)), "請輸入有效電話號碼")
    .transform((value) => normalizePhoneNumber(value)!),
  childName1: z.string().trim().min(1, "請輸入至少一位小朋友名稱").max(50),
  grade1: z.coerce.number().int().min(1).max(6),
  childName2: z.string().trim().max(50).optional(),
  grade2: z.coerce.number().int().min(1).max(6).optional(),
  childName3: z.string().trim().max(50).optional(),
  grade3: z.coerce.number().int().min(1).max(6).optional(),
  verificationCode: z.string().trim().refine((value) => value === "1234", "驗證碼不正確"),
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
  if (!canSignInWithAccountStatus(user.accountStatus)) {
    return { error: getAccountStatusLoginMessage(user.accountStatus) ?? "此帳戶暫時不可登入" };
  }

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
    const children = [
      { displayName: parsedAccount.data.childName1, grade: parsedAccount.data.grade1 },
      parsedAccount.data.childName2 ? { displayName: parsedAccount.data.childName2, grade: parsedAccount.data.grade2 ?? parsedAccount.data.grade1 } : null,
      parsedAccount.data.childName3 ? { displayName: parsedAccount.data.childName3, grade: parsedAccount.data.grade3 ?? parsedAccount.data.grade1 } : null,
    ].filter((child): child is { displayName: string; grade: number } => Boolean(child));
    const user = await db.user.create({
      data: {
        email: parsedAccount.data.email,
        phoneNumber: parsedAccount.data.phoneNumber,
        displayName: parsedAccount.data.name,
        passwordHash,
        children: {
          create: children,
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
