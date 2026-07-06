import { NextResponse } from "next/server";
import { verifyAndCreateAccount, resendVerificationCode } from "@/lib/auth/verification";
import { createSession } from "@/lib/auth/session";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6),
});

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  action: z.literal("resend"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a resend request
    const resendParsed = resendSchema.safeParse(body);
    if (resendParsed.success) {
      const result = await resendVerificationCode(resendParsed.data.email);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    // Otherwise, it's a verify request
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "請輸入有效的 6 位驗證碼" },
        { status: 400 },
      );
    }

    const { email, code } = parsed.data;
    const result = await verifyAndCreateAccount(email, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Create session and return redirect
    await createSession(result.userId!);

    return NextResponse.json({ success: true, redirect: "/dashboard" });
  } catch (error) {
    console.error("[api/verify]", error);
    return NextResponse.json(
      { error: "伺服器錯誤，請稍後再試" },
      { status: 500 },
    );
  }
}
