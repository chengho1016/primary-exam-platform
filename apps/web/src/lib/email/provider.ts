export type EmailProviderName = "gmail" | "resend" | "ses";

export type EmailProviderConfig =
  | { provider: "gmail"; from: string; user: string }
  | { provider: "resend"; from: string }
  | { provider: "ses"; from: string }
  | { provider: "unconfigured"; error: string };

type EmailEnvironment = Record<string, string | undefined>;

function gmailConfig(env: EmailEnvironment): EmailProviderConfig | null {
  const user = env.GMAIL_SMTP_USER?.trim();
  const appPassword = env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const from = env.GMAIL_FROM_EMAIL?.trim()
    || (user ? `考試吧 Exam Go <${user}>` : "");

  if (user && appPassword && from) {
    return { provider: "gmail", from, user };
  }
  return null;
}

function resendConfig(env: EmailEnvironment): EmailProviderConfig | null {
  const domain = env.RESEND_EMAIL_DOMAIN?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim()
    || (domain ? `考試吧 Exam Go <no-reply@${domain}>` : "");

  if (env.RESEND_API_KEY?.trim() && from) {
    return { provider: "resend", from };
  }
  return null;
}

function sesConfig(env: EmailEnvironment): EmailProviderConfig | null {
  if (
    env.AWS_ACCESS_KEY_ID?.trim()
    && env.AWS_SECRET_ACCESS_KEY?.trim()
    && env.AWS_SES_FROM_EMAIL?.trim()
  ) {
    return { provider: "ses", from: env.AWS_SES_FROM_EMAIL.trim() };
  }
  return null;
}

export function resolveEmailProvider(env: EmailEnvironment): EmailProviderConfig {
  const requested = env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (requested === "gmail") {
    return gmailConfig(env) ?? {
      provider: "unconfigured",
      error: "Gmail is selected but GMAIL_SMTP_USER and GMAIL_APP_PASSWORD are not configured",
    };
  }

  if (requested === "resend") {
    return resendConfig(env) ?? {
      provider: "unconfigured",
      error: "Resend is selected but RESEND_API_KEY and sender domain are not configured",
    };
  }

  if (requested === "ses") {
    return sesConfig(env) ?? {
      provider: "unconfigured",
      error: "SES is selected but AWS credentials and sender email are not configured",
    };
  }

  // Preserve the incumbent SES provider unless EMAIL_PROVIDER explicitly opts
  // in to Gmail or Resend.
  return sesConfig(env)
    ?? gmailConfig(env)
    ?? resendConfig(env)
    ?? { provider: "unconfigured", error: "No email provider is configured" };
}
