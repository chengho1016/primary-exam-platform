#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
MODE="${1:-}"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ENV_FILE" ]; then
  DATABASE_URL="$(node -e "const fs=require('fs'); const p=process.argv[1]; const line=fs.readFileSync(p,'utf8').split(/\r?\n/).find(l=>/^DATABASE_URL=/.test(l)); if(line){let v=line.slice(line.indexOf('=')+1).trim(); if((v.startsWith('\"')&&v.endsWith('\"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); process.stdout.write(v)}" "$ENV_FILE")"
  export DATABASE_URL
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required. Export it or set ENV_FILE=/path/to/.env" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required. Install PostgreSQL client tools first." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/primary-exam-$STAMP.dump"
SHA_PATH="$BACKUP_PATH.sha256"

if [ "$MODE" = "--dry-run" ]; then
  echo "Backup directory: $BACKUP_DIR"
  echo "Backup file: $BACKUP_PATH"
  echo "pg_dump: $(pg_dump --version)"
  exit 0
fi

pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file "$BACKUP_PATH"
shasum -a 256 "$BACKUP_PATH" > "$SHA_PATH"

cat <<SUMMARY
Backup complete:
$BACKUP_PATH
$SHA_PATH

Restore example:
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" "$BACKUP_PATH"
SUMMARY
