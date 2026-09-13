#!/bin/bash
# Tests de bout en bout locaux (non exécutés par `pnpm test`).
# Prérequis : PostgreSQL local, Playwright installé globalement (npm i -g playwright) avec Chromium,
# le projet construit (`pnpm build`). Usage :
#   tests/e2e/run.sh scenario            # scénario fonctionnel complet (emails via un faux SMTP local)
#   tests/e2e/run.sh mobile-audit ./out  # mesure le débordement horizontal de chaque page à 390 px (captures dans ./out)
# Variables : E2E_PG_HOST (défaut /tmp, socket), E2E_PG_PORT (5433), E2E_PG_USER (postgres).
set -u
cd "$(dirname "$0")/../.."
SCRIPT="${1:-scenario}"
OUT="${2:-/tmp}"
PG_HOST="${E2E_PG_HOST:-/tmp}"; PG_PORT="${E2E_PG_PORT:-5433}"; PG_USER="${E2E_PG_USER:-postgres}"
export DATABASE_URL="postgresql://${PG_USER}@localhost:${PG_PORT}/tremplin_e2e?host=${PG_HOST}"
export POSTGRES_URL_NON_POOLING="$DATABASE_URL"
export AUTH_SECRET="e2e-secret-not-for-production-0123456789"
export AUTH_URL="http://localhost:3000"
export NEXT_PUBLIC_SITE_URL="http://localhost:3000"
export CRON_SECRET="e2e-cron-secret-0123456789abcdef"
export E2E_PG_HOST="$PG_HOST" E2E_PG_PORT="$PG_PORT" E2E_PG_USER="$PG_USER"
export PORT=3000
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -q -c "DROP DATABASE IF EXISTS tremplin_e2e WITH (FORCE);" -c "CREATE DATABASE tremplin_e2e;" || exit 1
npx prisma migrate deploy >/dev/null 2>&1 || { echo "migrate failed"; exit 1; }
SEED_ADMIN_PASSWORD='AdminTremplin2027!' npx tsx prisma/seed.ts >/dev/null 2>&1 || { echo "seed failed"; exit 1; }
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d tremplin_e2e -q -c "UPDATE smtp_config SET smtp_host='127.0.0.1', smtp_port=2525, smtp_secure=false;"
nohup pnpm start > /tmp/e2e-server.log 2>&1 &
SERVER_PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/auth/login && break; sleep 1; done
NPM_GLOBAL_ROOT=$(npm root -g) PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}" node "tests/e2e/${SCRIPT}.mjs" "$OUT"
STATUS=$?
kill $SERVER_PID 2>/dev/null
for pid in $(ps -eo pid,cmd | grep -E "next-server" | grep -v grep | awk '{print $1}'); do kill $pid 2>/dev/null; done
exit $STATUS
