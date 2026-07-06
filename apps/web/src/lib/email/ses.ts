import "server-only";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { siteConfig } from "@/lib/site-config";

function getSesClient(): SESClient | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_SES_REGION || "ap-east-1";

  if (!accessKeyId || !secretAccessKey) {
    console.warn(
      "[email/ses] AWS credentials missing — email sending disabled. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
    );
    return null;
  }

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const ses = getSesClient();

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const from = process.env.AWS_SES_FROM_EMAIL;
  if (!from) {
    return { success: false, error: "AWS_SES_FROM_EMAIL not configured" };
  }
  if (!ses) {
    return { success: false, error: "SES client not configured — check AWS credentials" };
  }

  const subject = `${siteConfig.name} — 電郵驗證碼`;
  const htmlBody = `
<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#f9f9f9; padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden;">
    <tr><td style="padding:32px 32px 16px;">
      <h1 style="margin:0; font-size:22px; color:#1a1a2e;">${siteConfig.name}</h1>
      <p style="color:#555; font-size:15px; margin:8px 0 0;">請使用以下驗證碼完成註冊：</p>
    </td></tr>
    <tr><td style="padding:0 32px 24px;">
      <div style="background:#f0f4ff; border-radius:8px; padding:20px; text-align:center;">
        <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#1a1a2e;">${code}</span>
      </div>
      <p style="color:#888; font-size:13px; margin:12px 0 0;">驗證碼將於 10 分鐘後失效。如非你本人操作，請忽略此電郵。</p>
    </td></tr>
    <tr><td style="border-top:1px solid #eee; padding:16px 32px;">
      <p style="color:#aaa; font-size:12px; margin:0;">此電郵由 ${siteConfig.name} 自動發送，請勿回覆。</p>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
      },
    });
    const response = await ses.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SES error";
    console.error("[email/ses] Failed to send verification email:", message);
    return { success: false, error: message };
  }
}
