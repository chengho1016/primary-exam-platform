#!/bin/bash
set -euo pipefail

PG_BIN="/opt/homebrew/opt/postgresql@17/bin"
DATA_DIR="$(pwd)/.data/postgres"
LOG_FILE="$(pwd)/.data/postgres.log"

if [[ ! -x "$PG_BIN/postgres" ]]; then
  echo "PostgreSQL 17 is not installed. Run: brew install postgresql@17"
  exit 1
fi

if [[ ! -f "$DATA_DIR/PG_VERSION" ]]; then
  mkdir -p "$DATA_DIR"
  "$PG_BIN/initdb" -D "$DATA_DIR" --username=primary_exam --auth-local=trust --auth-host=trust --encoding=UTF8 --no-locale
fi

if ! "$PG_BIN/pg_isready" -h 127.0.0.1 -p 54329 -U primary_exam >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" -o "-p 54329 -h 127.0.0.1" start
fi

if ! "$PG_BIN/psql" -h 127.0.0.1 -p 54329 -U primary_exam -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='primary_exam'" | grep -q 1; then
  "$PG_BIN/createdb" -h 127.0.0.1 -p 54329 -U primary_exam primary_exam
fi

"$PG_BIN/pg_isready" -h 127.0.0.1 -p 54329 -U primary_exam -d primary_exam
