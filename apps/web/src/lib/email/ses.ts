import "server-only";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { buildVerificationEmail } from "@/lib/email/verification-message";

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

export async function sendVerificationEmailWithSes(
  to: string,
  code: string,
  from: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const ses = getSesClient();
  if (!ses) {
    return { success: false, error: "SES client not configured — check AWS credentials" };
  }

  const message = buildVerificationEmail(code);

  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: message.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: message.html, Charset: "UTF-8" },
          Text: { Data: message.text, Charset: "UTF-8" },
        },
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
