import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createTransportMock, sendMailMock } = vi.hoisted(() => ({
  createTransportMock: vi.fn(),
  sendMailMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));
vi.mock("@/lib/email/verification-message", () => ({
  buildVerificationEmail: (code: string) => ({
    subject: "考試吧 Exam Go — 電郵驗證碼",
    html: `<strong>${code}</strong>`,
    text: `驗證碼：${code}`,
  }),
}));

import { sendVerificationEmailWithGmail } from "./gmail";

describe("sendVerificationEmailWithGmail", () => {
  beforeEach(() => {
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    sendMailMock.mockResolvedValue({ messageId: "gmail-123" });
    createTransportMock.mockReturnValue({ sendMail: sendMailMock });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends the verification code through Gmail SMTP", async () => {
    const result = await sendVerificationEmailWithGmail(
      "parent@example.com",
      "123456",
      {
        from: "考試吧 Exam Go <examgohk@gmail.com>",
        user: "examgohk@gmail.com",
      },
    );

    expect(result).toEqual({ success: true, messageId: "gmail-123" });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "examgohk@gmail.com",
          pass: "abcdefghijklmnop",
        },
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "考試吧 Exam Go <examgohk@gmail.com>",
      to: "parent@example.com",
      subject: "考試吧 Exam Go — 電郵驗證碼",
      html: "<strong>123456</strong>",
      text: "驗證碼：123456",
    });
  });

  it("returns an SMTP error without throwing", async () => {
    sendMailMock.mockRejectedValue(new Error("Authentication failed"));

    await expect(
      sendVerificationEmailWithGmail("parent@example.com", "123456", {
        from: "考試吧 Exam Go <examgohk@gmail.com>",
        user: "examgohk@gmail.com",
      }),
    ).resolves.toEqual({ success: false, error: "Authentication failed" });
  });
});
