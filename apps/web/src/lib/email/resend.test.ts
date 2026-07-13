import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/verification-message", () => ({
  buildVerificationEmail: (code: string) => ({
    subject: "考試吧 Exam Go — 電郵驗證碼",
    html: `<strong>${code}</strong>`,
    text: `驗證碼：${code}`,
  }),
}));

import { sendVerificationEmailWithResend } from "./resend";

describe("sendVerificationEmailWithResend", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the verification code through the Resend API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email-123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendVerificationEmailWithResend(
      "parent@example.com",
      "123456",
      "考試吧 Exam Go <no-reply@examgohk.com>",
    );

    expect(result).toEqual({ success: true, messageId: "email-123" });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(options.body));
    expect(payload).toMatchObject({
      from: "考試吧 Exam Go <no-reply@examgohk.com>",
      to: ["parent@example.com"],
      subject: "考試吧 Exam Go — 電郵驗證碼",
    });
    expect(payload.html).toContain("123456");
    expect(payload.text).toContain("123456");
  });

  it("returns the Resend API error without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Domain is not verified" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      sendVerificationEmailWithResend(
        "parent@example.com",
        "123456",
        "考試吧 Exam Go <no-reply@examgohk.com>",
      ),
    ).resolves.toEqual({ success: false, error: "Domain is not verified" });
  });
});
