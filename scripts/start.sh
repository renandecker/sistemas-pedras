#!/usr/bin/env bash
#
# start.sh — Sobe o ambiente local completo do Sistema de Gestão para Marmoraria:
#   1. Sobe o PostgreSQL via Docker (cria o container e o banco "marmoraria_db" se não existirem)
#   2. Aguarda o banco ficar pronto para aceitar conexões
#   3. Inicia o backend Quarkus em modo dev (aplica as migrations Flyway automaticamente)
#   4. Inicia o frontend React (Vite) com proxy para a API
#
# Os logs de backend e frontend são gravados em .logs/ e também exibidos ao vivo
# no terminal (prefixados com [backend]/[frontend]). Se qualquer processo cair,
# o script mostra as últimas linhas do log correspondente e encerra com erro.
#
# Uso:
#   ./scripts/start.sh              # sobe banco + backend + frontend
#   ./scripts/start.sh --db-only    # sobe apenas o banco de dados
#   ./scripts/start.sh --no-frontend  # sobe banco + backend, sem o frontend
#
# Encerrar: Ctrl+C (para o backend e o frontend; o banco continua rodando em segundo plano).
# Para derrubar também o banco, use ./scripts/stop.sh
#
set -uo pipefail

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/.logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

DB_CONTAINER="marmoraria-db"
DB_USER="marmoraria"
DB_NAME="marmoraria_db"
DB_PORT="5432"

DB_ONLY=false
NO_FRONTEND=false

for arg in "$@"; do
  case "$arg" in
    --db-only) DB_ONLY=true ;;
    --no-frontend) NO_FRONTEND=true ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^#//'
      exit 0
      ;;
    *)
      echo "Argumento desconhecido: $arg (use --help)"
      exit 1
      ;;
  esac
done

mkdir -p "$LOG_DIR"
: > "$BACKEND_LOG"
[ "$NO_FRONTEND" = false ] && : > "$FRONTEND_LOG"

# ---------------------------------------------------------------------------
# Helpers de output
# ---------------------------------------------------------------------------
info()  { echo -e "\033[1;34m[start]\033[0m $1"; }
ok()    { echo -e "\033[1;32m[ok]\033[0m $1"; }
warn()  { echo -e "\033[1;33m[aviso]\033[0m $1"; }
fail()  { echo -e "\033[1;31m[erro]\033[0m $1" >&2; }

# Mostra as últimas N linhas de um log de forma destacada, ao falhar
mostrar_falha() {
  local titulo="$1" arquivo="$2"
  echo ""
  echo -e "\033[1;31m========== $titulo — últimas linhas do log ($arquivo) ==========\033[0m"
  if [ -f "$arquivo" ]; then
    tail -n 60 "$arquivo"
  else
    echo "(arquivo de log não encontrado)"
  fi
  echo -e "\033[1;31m====================================================================\033[0m"
}

PIDS_PARA_MATAR=()

cleanup() {
  echo ""
  info "Encerrando..."
  for pid in "${PIDS_PARA_MATAR[@]:-}"; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  ok "Processos finalizados. O banco de dados continua rodando (use ./scripts/stop.sh para pará-lo)."
}
trap cleanup INT TERM EXIT

# ---------------------------------------------------------------------------
# 0. Pré-requisitos
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker não encontrado. Instale o Docker antes de continuar."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "Nem 'docker compose' nem 'docker-compose' foram encontrados."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Sobe o PostgreSQL (cria o container/volume/banco na primeira execução)
# ---------------------------------------------------------------------------
info "Subindo PostgreSQL (container '$DB_CONTAINER', banco '$DB_NAME')..."
if ! (cd "$ROOT_DIR" && $COMPOSE up -d db); then
  fail "Falha ao subir o container do banco de dados via '$COMPOSE up -d db'."
  echo "Verifique se o Docker está em execução e rode manualmente para ver o erro completo:"
  echo "  cd '$ROOT_DIR' && $COMPOSE up db"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Aguarda o banco aceitar conexões
# ---------------------------------------------------------------------------
info "Aguardando o banco de dados ficar pronto..."
TENTATIVAS=30
until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  TENTATIVAS=$((TENTATIVAS - 1))
  if [ "$TENTATIVAS" -le 0 ]; then
    fail "O banco de dados não ficou pronto a tempo."
    echo ""
    echo "----- docker logs $DB_CONTAINER (últimas 60 linhas) -----"
    docker logs --tail 60 "$DB_CONTAINER" 2>&1
    echo "----------------------------------------------------------"
    exit 1
  fi
  sleep 1
done
ok "PostgreSQL pronto em localhost:$DB_PORT (usuário: $DB_USER, banco: $DB_NAME)."

# Garantia extra: cria o banco caso o container já existisse sem ele
DB_EXISTE=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null || echo "")
if [ "$DB_EXISTE" != "1" ]; then
  info "Banco '$DB_NAME' não encontrado, criando..."
  if ! docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"; then
    fail "Falha ao criar o banco '$DB_NAME'. Veja a saída acima para detalhes."
    exit 1
  fi
  ok "Banco '$DB_NAME' criado."
fi

if [ "$DB_ONLY" = true ]; then
  trap - INT TERM EXIT
  ok "Banco de dados no ar. Encerrando (--db-only)."
  exit 0
fi

# ---------------------------------------------------------------------------
# 3. Sobe o backend (Quarkus dev mode) — aplica as migrations Flyway sozinho
# ---------------------------------------------------------------------------
if [ ! -d "$BACKEND_DIR" ]; then
  fail "Pasta backend/ não encontrada em $BACKEND_DIR"
  exit 1
fi

MVN_CMD="./mvnw"
if [ ! -f "$BACKEND_DIR/mvnw" ]; then
  if ! command -v mvn >/dev/null 2>&1; then
    fail "Maven não encontrado e mvnw ausente. Instale o Maven ou gere o wrapper (mvn -N wrapper:wrapper)."
    exit 1
  fi
  MVN_CMD="mvn"
fi

info "Iniciando backend Quarkus (log completo em .logs/backend.log)..."
(
  cd "$BACKEND_DIR"
  export DB_URL="jdbc:postgresql://localhost:$DB_PORT/$DB_NAME"
  export DB_USER="$DB_USER"
  export DB_PASSWORD="$DB_USER"
  exec $MVN_CMD quarkus:dev
) > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
PIDS_PARA_MATAR+=("$BACKEND_PID")

# tail ao vivo do log do backend, prefixado, para acompanhar no terminal
( tail -n +1 -f "$BACKEND_LOG" 2>/dev/null | sed -u 's/^/[backend] /' ) &
TAIL_BACKEND_PID=$!
PIDS_PARA_MATAR+=("$TAIL_BACKEND_PID")

# ---------------------------------------------------------------------------
# 4. Sobe o frontend (Vite dev server)
# ---------------------------------------------------------------------------
FRONTEND_PID=""
TAIL_FRONTEND_PID=""
if [ "$NO_FRONTEND" = false ]; then
  if [ ! -d "$FRONTEND_DIR" ]; then
    fail "Pasta frontend/ não encontrada em $FRONTEND_DIR"
    exit 1
  fi
  if ! command -v npm >/dev/null 2>&1; then
    fail "npm não encontrado. Instale o Node.js antes de continuar."
    exit 1
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    info "Instalando dependências do frontend (primeira execução)..."
    if ! (cd "$FRONTEND_DIR" && npm install); then
      fail "Falha ao instalar dependências do frontend (npm install)."
      exit 1
    fi
  fi

  info "Iniciando frontend (Vite) em http://localhost:5173 (log completo em .logs/frontend.log)..."
  ( cd "$FRONTEND_DIR" && exec npm run dev ) > "$FRONTEND_LOG" 2>&1 &
  FRONTEND_PID=$!
  PIDS_PARA_MATAR+=("$FRONTEND_PID")

  ( tail -n +1 -f "$FRONTEND_LOG" 2>/dev/null | sed -u 's/^/[frontend] /' ) &
  TAIL_FRONTEND_PID=$!
  PIDS_PARA_MATAR+=("$TAIL_FRONTEND_PID")
fi

echo ""
ok "Ambiente no ar!"
echo ""
echo "  API + backend:  http://localhost:8080"
[ "$NO_FRONTEND" = false ] && echo "  Frontend:       http://localhost:5173"
echo ""
info "Exibindo logs ao vivo abaixo (Ctrl+C para parar backend/frontend)."
echo ""

# ---------------------------------------------------------------------------
# 5. Monitora os processos: se algum cair sozinho, avisa e mostra o log
# ---------------------------------------------------------------------------
while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    fail "O backend encerrou inesperadamente."
    mostrar_falha "BACKEND" "$BACKEND_LOG"
    exit 1
  fi
  if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    fail "O frontend encerrou inesperadamente."
    mostrar_falha "FRONTEND" "$FRONTEND_LOG"
    exit 1
  fi
  sleep 2
done
