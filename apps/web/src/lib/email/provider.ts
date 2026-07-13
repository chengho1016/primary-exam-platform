export type EmailProviderName = "resend" | "ses";

export type EmailProviderConfig =
  | { provider: "resend"; from: string }
  | { provider: "ses"; from: string }
  | { provider: "unconfigured"; error: string };

type EmailEnvironment = Record<string, string | undefined>;

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

  // Preserve the incumbent provider until EMAIL_PROVIDER explicitly opts in to
  // Resend. Marketplace provisioning can expose Resend variables before the
  // sender domain finishes DNS verification.
  return sesConfig(env)
    ?? resendConfig(env)
    ?? { provider: "unconfigured", error: "No email provider is configured" };
}
