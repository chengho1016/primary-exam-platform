import { siteConfig } from "@/lib/site-config";

export function buildVerificationEmail(code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${siteConfig.name} — 電郵驗證碼`;
  const text = [
    `${siteConfig.name} 電郵驗證碼`,
    "",
    `你的驗證碼是：${code}`,
    "",
    "驗證碼將於 10 分鐘後失效。如非你本人操作，請忽略此電郵。",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FFEEE7;padding:24px;color:#2D2E2A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #EAD8CF;">
    <tr><td style="padding:32px 32px 16px;">
      <h1 style="margin:0;font-size:22px;color:#2D2E2A;">${siteConfig.name}</h1>
      <p style="color:#665B53;font-size:15px;margin:8px 0 0;">請使用以下驗證碼完成註冊：</p>
    </td></tr>
    <tr><td style="padding:0 32px 24px;">
      <div style="background:#FFF3ED;border-radius:12px;padding:20px;text-align:center;border:1px solid #F2D4C4;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#2D2E2A;">${code}</span>
      </div>
      <p style="color:#81756D;font-size:13px;line-height:1.6;margin:12px 0 0;">驗證碼將於 10 分鐘後失效。如非你本人操作，請忽略此電郵。</p>
    </td></tr>
    <tr><td style="border-top:1px solid #F0E2DA;padding:16px 32px;">
      <p style="color:#9B8E86;font-size:12px;margin:0;">此電郵由 ${siteConfig.name} 自動發送，請勿回覆。</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
