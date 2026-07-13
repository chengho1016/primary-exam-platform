import "server-only";
import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/prisma";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";

const CODE_LENGTH = 6;
const EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export interface PendingRegistration {
  name: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  children: Array<{ displayName: string; grade: number }>;
}

function generateCode(): string {
  const digits: number[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    digits.push(randomInt(0, 10));
  }
  return digits.join("");
}

export async function createVerificationToken(
  email: string,
  payload: PendingRegistration,
): Promise<{ success: boolean; error?: string }> {
  // 1. Clean up old tokens for this email
  await db.emailVerificationToken.deleteMany({
    where: { email },
  });

  // 2. Check if user already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "此電郵地址已經註冊" };
  }

  // 3. Generate code and store
  const code = generateCode();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await db.emailVerificationToken.create({
    data: {
      email,
      code,
      payload: payload as unknown as Prisma.InputJsonObject,
      expiresAt,
    },
  });

  // 4. Send email
  const result = await sendVerificationEmail(email, code);
  if (!result.success) {
    console.error(
      "[verification] Failed to send email — token created but email not delivered:",
      result.error,
    );
    // Don't delete token — user can retry or admin can manually verify
    return { success: false, error: "未能發送驗證電郵，請稍後再試" };
  }

  return { success: true };
}

export async function verifyAndCreateAccount(
  email: string,
  code: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  // 1. Find token
  const token = await db.emailVerificationToken.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
  });

  if (!token) {
    return { success: false, error: "驗證碼已過期，請重新註冊" };
  }

  // 2. Check attempts
  if (token.attempts >= MAX_ATTEMPTS) {
    await db.emailVerificationToken.delete({ where: { id: token.id } });
    return { success: false, error: "驗證嘗試次數過多，請重新註冊" };
  }

  // 3. Verify code
  if (token.code !== code) {
    await db.emailVerificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - token.attempts - 1;
    return {
      success: false,
      error: remaining > 0
        ? `驗證碼不正確，還有 ${remaining} 次機會`
        : "驗證碼不正確，請重新註冊",
    };
  }

  // 4. Parse payload and create user account
  const payload = token.payload as unknown as PendingRegistration;

  try {
    // Check again (race condition protection)
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      await db.emailVerificationToken.delete({ where: { id: token.id } });
      return { success: false, error: "此電郵地址已經註冊" };
    }

    const user = await db.user.create({
      data: {
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        displayName: payload.name,
        passwordHash: payload.passwordHash,
        children: {
          create: payload.children,
        },
      },
    });

    // 5. Clean up token
    await db.emailVerificationToken.delete({ where: { id: token.id } });

    return { success: true, userId: user.id };
  } catch (error) {
    const isUniqueConstraint =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002";
    if (isUniqueConstraint) {
      await db.emailVerificationToken.delete({ where: { id: token.id } });
      return { success: false, error: "此電郵地址已經註冊" };
    }
    console.error("[verification] Failed to create account:", error);
    return { success: false, error: "未能建立帳戶，請稍後再試" };
  }
}

export async function resendVerificationCode(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const token = await db.emailVerificationToken.findFirst({
    where: { email },
  });

  if (!token) {
    return { success: false, error: "找不到待驗證的註冊，請重新註冊" };
  }

  // Generate new code, extend expiry
  const code = generateCode();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await db.emailVerificationToken.update({
    where: { id: token.id },
    data: { code, attempts: 0, expiresAt },
  });

  const result = await sendVerificationEmail(email, code);
  if (!result.success) {
    return { success: false, error: "未能發送驗證電郵，請稍後再試" };
  }

  return { success: true };
}
