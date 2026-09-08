#!/usr/bin/env bash
#
# stop.sh — Derruba o container do PostgreSQL local subido pelo start.sh.
#
# Uso:
#   ./scripts/stop.sh          # para o container (mantém os dados no volume)
#   ./scripts/stop.sh --wipe   # para o container e APAGA todos os dados (volume)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info()  { echo -e "\033[1;34m[stop]\033[0m $1"; }
ok()    { echo -e "\033[1;32m[ok]\033[0m $1"; }
fail()  { echo -e "\033[1;31m[erro]\033[0m $1"; exit 1; }

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "Nem 'docker compose' nem 'docker-compose' foram encontrados."
fi

cd "$ROOT_DIR"

if [ "${1:-}" = "--wipe" ]; then
  info "Parando o banco e apagando todos os dados (volume)..."
  $COMPOSE down -v
  ok "Banco parado e dados apagados."
else
  info "Parando o banco (dados preservados no volume)..."
  $COMPOSE stop db
  ok "Banco parado. Use ./scripts/start.sh para subir novamente."
fi
