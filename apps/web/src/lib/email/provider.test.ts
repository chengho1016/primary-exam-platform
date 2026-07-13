import { describe, expect, it } from "vitest";
import { resolveEmailProvider } from "./provider";

describe("resolveEmailProvider", () => {
  it("uses Gmail when it is explicitly selected", () => {
    expect(
      resolveEmailProvider({
        EMAIL_PROVIDER: "gmail",
        GMAIL_SMTP_USER: "examgohk@gmail.com",
        GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
      }),
    ).toEqual({
      provider: "gmail",
      from: "考試吧 Exam Go <examgohk@gmail.com>",
      user: "examgohk@gmail.com",
    });
  });

  it("uses Resend when its marketplace variables are configured", () => {
    expect(
      resolveEmailProvider({
        RESEND_API_KEY: "re_test",
        RESEND_EMAIL_DOMAIN: "examgohk.com",
      }),
    ).toEqual({ provider: "resend", from: "考試吧 Exam Go <no-reply@examgohk.com>" });
  });

  it("keeps SES active when both providers exist and no provider is explicitly selected", () => {
    expect(
      resolveEmailProvider({
        RESEND_API_KEY: "re_test",
        RESEND_EMAIL_DOMAIN: "examgohk.com",
        AWS_ACCESS_KEY_ID: "key",
        AWS_SECRET_ACCESS_KEY: "secret",
        AWS_SES_FROM_EMAIL: "examgohk@gmail.com",
      }),
    ).toEqual({ provider: "ses", from: "examgohk@gmail.com" });
  });

  it("uses an explicit Resend from address when provided", () => {
    expect(
      resolveEmailProvider({
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "Exam Go <verify@send.examgohk.com>",
      }),
    ).toEqual({ provider: "resend", from: "Exam Go <verify@send.examgohk.com>" });
  });

  it("keeps SES as the fallback while Resend onboarding is incomplete", () => {
    expect(
      resolveEmailProvider({
        AWS_ACCESS_KEY_ID: "key",
        AWS_SECRET_ACCESS_KEY: "secret",
        AWS_SES_FROM_EMAIL: "examgohk@gmail.com",
      }),
    ).toEqual({ provider: "ses", from: "examgohk@gmail.com" });
  });

  it("returns a useful configuration error for an explicitly selected incomplete provider", () => {
    expect(resolveEmailProvider({ EMAIL_PROVIDER: "resend" })).toEqual({
      provider: "unconfigured",
      error: "Resend is selected but RESEND_API_KEY and sender domain are not configured",
    });
  });

  it("reports missing Gmail credentials without exposing secrets", () => {
    expect(resolveEmailProvider({ EMAIL_PROVIDER: "gmail" })).toEqual({
      provider: "unconfigured",
      error: "Gmail is selected but GMAIL_SMTP_USER and GMAIL_APP_PASSWORD are not configured",
    });
  });

  it("reports that no provider is configured", () => {
    expect(resolveEmailProvider({})).toEqual({
      provider: "unconfigured",
      error: "No email provider is configured",
    });
  });
});
