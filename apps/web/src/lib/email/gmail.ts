import "server-only";
import nodemailer from "nodemailer";
import type { EmailSendResult } from "@/lib/email/resend";
import { buildVerificationEmail } from "@/lib/email/verification-message";

interface GmailEmailConfig {
  from: string;
  user: string;
}

function getAppPassword(): string | null {
  return process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") || null;
}

export async function sendVerificationEmailWithGmail(
  to: string,
  code: string,
  config: GmailEmailConfig,
): Promise<EmailSendResult> {
  const appPassword = getAppPassword();
  if (!appPassword) {
    return { success: false, error: "GMAIL_APP_PASSWORD not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.user,
      pass: appPassword,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const message = buildVerificationEmail(code);

  try {
    const response = await transporter.sendMail({
      from: config.from,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { success: true, messageId: response.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gmail SMTP error";
    console.error("[email/gmail] Failed to send verification email:", message);
    return { success: false, error: message };
  }
}
