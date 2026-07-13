import "server-only";
import { buildVerificationEmail } from "@/lib/email/verification-message";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendVerificationEmailWithResend(
  to: string,
  code: string,
  from: string,
): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const message = buildVerificationEmail(code);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    const body = await response.json() as { id?: string; message?: string; name?: string };
    if (!response.ok || !body.id) {
      const error = body.message || body.name || `Resend returned HTTP ${response.status}`;
      console.error("[email/resend] Failed to send verification email:", error);
      return { success: false, error };
    }

    return { success: true, messageId: body.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend error";
    console.error("[email/resend] Failed to send verification email:", message);
    return { success: false, error: message };
  }
}
