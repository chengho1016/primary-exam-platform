# Email verification setup

This project creates parent accounts only after the user enters a 6-digit email verification code.

## Production email provider

The current production setup uses Gmail SMTP because the project does not own a custom domain.

Required Vercel environment variables:

```env
EMAIL_PROVIDER=gmail
GMAIL_SMTP_USER=examgohk@gmail.com
GMAIL_APP_PASSWORD=...
```

`GMAIL_FROM_EMAIL` is optional. If it is not set, the app sends from:

```text
考試吧 Exam Go <examgohk@gmail.com>
```

`GMAIL_APP_PASSWORD` must be a Google app password, not the normal Google account password. The application removes spaces automatically if the password is copied in grouped form.

## Current flow

1. `/register` accepts the parent and child registration form.
2. `registerAction` stores the pending registration in `EmailVerificationToken`.
3. The app sends a 6-digit code by email.
4. The inline verification step posts to `/api/auth/verify`.
5. The account is created only after the code is correct.

Verification codes expire after 10 minutes and allow 5 attempts.

## Future custom-domain setup

The Resend and AWS SES adapters remain available. After purchasing and verifying a custom domain, set `EMAIL_PROVIDER=resend` or `EMAIL_PROVIDER=ses` and configure that provider's credentials.
