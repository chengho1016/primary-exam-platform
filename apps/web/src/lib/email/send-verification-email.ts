import "server-only";
import { resolveEmailProvider } from "@/lib/email/provider";
import { sendVerificationEmailWithResend } from "@/lib/email/resend";
import { sendVerificationEmailWithSes } from "@/lib/email/ses";

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = resolveEmailProvider(process.env);

  if (config.provider === "resend") {
    return sendVerificationEmailWithResend(to, code, config.from);
  }

  if (config.provider === "ses") {
    return sendVerificationEmailWithSes(to, code, config.from);
  }

  console.error("[email] Verification email provider is not configured:", config.error);
  return { success: false, error: config.error };
}
