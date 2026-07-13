# Email verification setup

This project creates parent accounts only after the user enters a 6-digit email verification code.

## Production email provider

Use Resend for production verification email.

Required Vercel environment variables:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
RESEND_EMAIL_DOMAIN=examgohk.com
```

`RESEND_FROM_EMAIL` is optional. If it is not set, the app sends from:

```text
考試吧 Exam Go <no-reply@examgohk.com>
```

## Wix DNS records for `examgohk.com`

The domain currently uses Wix DNS:

```text
ns2.wixdns.net
ns3.wixdns.net
```

Add these records in Wix before switching on production traffic:

| Type | Host/name | Value | Priority |
| --- | --- | --- | --- |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBOxK0yPaXj3SWKzohS/n/N/zS4A0WkpfgR+cf1ZDLBS/sA4azGSrZL9cFePwL3MDTiIkwk54GT8uj/hWL/qtpIYqSCArxCcpyp0Xjvj06bSQ63fyGttKjgifzaTq9UmfleYELRHHi2vSTJFxfeCuJrkn9FMA+tCuT2dAn4CbM1wIDAQAB` | |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | |

After the records propagate, verify the domain in Resend. The expected status is `verified`.

## Current flow

1. `/register` accepts the parent and child registration form.
2. `registerAction` stores the pending registration in `EmailVerificationToken`.
3. The app sends a 6-digit code by email.
4. The inline verification step posts to `/api/auth/verify`.
5. The account is created only after the code is correct.

Verification codes expire after 10 minutes and allow 5 attempts.
