import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import { createVerificationToken } from "@/lib/auth/verification";

const sendVerificationSchema = z.object({
  name: z.string().trim().min(2, "請輸入家長稱呼").max(50),
  email: z.string().trim().toLowerCase().email("請輸入有效電郵地址"),
  phoneNumber: z
    .string()
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
  password: z
    .string()
    .min(8, "密碼最少需要8個字元")
    .regex(/[A-Za-z]/, "密碼需要包含英文字母")
    .regex(/[0-9]/, "密碼需要包含數字"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }

    const { name, email, phoneNumber, password, childName1, grade1, childName2, grade2, childName3, grade3 } = parsed.data;

    // Build children array
    const children = [
      { displayName: childName1, grade: grade1 },
      childName2 ? { displayName: childName2, grade: grade2 ?? grade1 } : null,
      childName3 ? { displayName: childName3, grade: grade3 ?? grade1 } : null,
    ].filter((c): c is { displayName: string; grade: number } => Boolean(c));

    // Hash password BEFORE storing (we store the hash, not plaintext)
    const passwordHash = await hashPassword(password);

    const result = await createVerificationToken(email, {
      name,
      email,
      phoneNumber,
      passwordHash,
      children,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/send-verification]", error);
    return NextResponse.json(
      { error: "伺服器錯誤，請稍後再試" },
      { status: 500 },
    );
  }
}
