#!/bin/bash
set -euo pipefail

DATA_DIR="$(pwd)/.data/postgres"
if [[ -f "$DATA_DIR/PG_VERSION" ]]; then
  /opt/homebrew/opt/postgresql@17/bin/pg_ctl -D "$DATA_DIR" stop
fi
