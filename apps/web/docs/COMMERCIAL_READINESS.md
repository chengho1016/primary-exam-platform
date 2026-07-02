# Commercial Readiness Runbook

Last updated: 2026-07-02

This is the operational checklist for turning 小學堂 from internal/demo use into a paid MVP.

## What is now ready

- Public pricing page: `/pricing`
- Contact/opening workflow: `/contact`
- Legal basics: `/privacy`, `/terms`
- Admin can create accounts from `/admin/users`
- Admin can reset user/admin passwords from `/admin/users/[userId]/edit`
- Admin can set role, membership status, plan ID, print allowance, and period dates
- All admin user changes write `AdminAuditLog`
- Database overview shows counts, storage estimate, recent users, print jobs, and audit logs
- Backup script exists at `scripts/backup-database.sh`

## Manual paid-MVP workflow

1. Parent chooses plan on `/pricing` and contacts support.
2. Admin opens `/admin/users`.
3. If the parent has no account, create one with role `PARENT`.
4. Set membership to `ACTIVE`, provider plan ID such as `monthly-basic`, and print allowance.
5. Parent logs in and uses member-only papers/practice/print features.
6. Record payment reference outside the app until Stripe/PayMe/FPS integration is added.

## Backup procedure

Dry-run:

```bash
cd apps/web
DATABASE_URL="postgresql://..." scripts/backup-database.sh --dry-run
```

Create backup:

```bash
cd apps/web
DATABASE_URL="postgresql://..." scripts/backup-database.sh
```

Restore example:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" backups/primary-exam-YYYYMMDD-HHMMSS.dump
```

## Remaining automation after MVP

- Add payment provider webhook to create/update `Subscription` automatically.
- Move uploaded PDFs from base64 DB storage to object storage/direct upload for large files.
- Add generated worksheet records after math topic readiness reaches enough verified questions.
- Add email notification for password reset/payment confirmation.
