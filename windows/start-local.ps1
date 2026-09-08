<#
    start-local.ps1
    ----------------
    Sobe o ambiente local completo no Windows:
      1) PostgreSQL via Docker (docker-compose.yml na raiz do projeto)
      2) Backend Quarkus (mvn quarkus:dev)
      3) Frontend React (npm run dev)
      4) [opcional, -Mobile] App mobile Expo (npx expo start)

    Cada serviço abre em sua PRÓPRIA janela do PowerShell (para você ver erros
    em tempo real) e, ao mesmo tempo, grava tudo em arquivo de log dentro de
    .\logs, para você conferir depois ou anexar num chamado de suporte.

    Uso:
        Botão direito > "Executar com PowerShell"
        ou, num terminal PowerShell:
            .\windows\start-local.ps1
            .\windows\start-local.ps1 -Mobile

    Se aparecer erro de "execução de scripts desabilitada", rode antes:
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

    Ou simplesmente dê duplo clique em start-local.bat, que já contorna isso.
#>

param(
    [switch]$Mobile
)

# Importante: NÃO usamos 'Stop' aqui. Comandos externos (docker, mvn, npm)
# escrevem avisos/infos no stream de erro (stderr) o tempo todo — com
# ErrorActionPreference = 'Stop', o PowerShell trata cada linha de stderr
# como erro fatal e aborta o script. Em vez disso, cada etapa crítica checa
# $LASTEXITCODE explicitamente e chama Write-ErroFatal quando necessário.
$ErrorActionPreference = 'Continue'

# ----------------------------------------------------------------------------
# 0. Caminhos base
# ----------------------------------------------------------------------------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir     = Split-Path -Parent $ScriptDir
$BackendDir  = Join-Path $RootDir 'backend'
$FrontendDir = Join-Path $RootDir 'frontend'
$MobileDir   = Join-Path $RootDir 'mobile'
$LogsDir     = Join-Path $RootDir 'logs'

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

$BackendLog  = Join-Path $LogsDir 'backend.log'
$FrontendLog = Join-Path $LogsDir 'frontend.log'
$MobileLog   = Join-Path $LogsDir 'mobile.log'
$DbLog       = Join-Path $LogsDir 'database.log'

function Write-Step($mensagem) {
    Write-Host ""
    Write-Host "==> $mensagem" -ForegroundColor Cyan
}

function Write-ErroFatal($mensagem) {
    Write-Host ""
    Write-Host "ERRO: $mensagem" -ForegroundColor Red
    Write-Host "Consulte os logs em: $LogsDir" -ForegroundColor Red
    exit 1
}

function Test-Comando($nome) {
    return [bool](Get-Command $nome -ErrorAction SilentlyContinue)
}

Write-Host "==========================================================" -ForegroundColor DarkGray
Write-Host " Sistema de Gestao para Marmoraria - Inicializacao local (Windows)" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor DarkGray

# ----------------------------------------------------------------------------
# 1. Verificar pré-requisitos
# ----------------------------------------------------------------------------
Write-Step "Verificando pre-requisitos (docker, mvn, node, npm)..."

$temDocker = Test-Comando 'docker'
$temMvn    = Test-Comando 'mvn'
$temNode   = Test-Comando 'node'
$temNpm    = Test-Comando 'npm'

if (-not $temDocker) {
    Write-Host "  [AVISO] Docker nao encontrado no PATH." -ForegroundColor Yellow
    Write-Host "  Instale o Docker Desktop (https://www.docker.com/products/docker-desktop)" -ForegroundColor Yellow
    Write-Host "  ou rode o PostgreSQL manualmente e ajuste windows\create-database.ps1." -ForegroundColor Yellow
}
if (-not $temMvn) { Write-ErroFatal "Maven (mvn) nao encontrado no PATH. Instale o Maven 3.8+ e reabra o terminal." }
if (-not $temNode) { Write-ErroFatal "Node.js nao encontrado no PATH. Instale o Node 18+ e reabra o terminal." }
if (-not $temNpm) { Write-ErroFatal "npm nao encontrado no PATH. Reinstale o Node.js." }
if ($Mobile -and -not $temNode) { Write-ErroFatal "Node.js e necessario tambem para o app mobile (Expo)." }

Write-Host "  OK." -ForegroundColor Green

# ----------------------------------------------------------------------------
# 2. Subir / criar o banco de dados (PostgreSQL via Docker)
# ----------------------------------------------------------------------------
if ($temDocker) {
    Write-Step "Subindo PostgreSQL via docker compose (cria o banco 'marmoraria_db' automaticamente)..."

    Push-Location $RootDir
    try {
        docker compose up -d 2>&1 | Tee-Object -FilePath $DbLog
        if ($LASTEXITCODE -ne 0) {
            Write-ErroFatal "Falha ao rodar 'docker compose up -d'. Veja $DbLog. O Docker Desktop esta aberto e rodando?"
        }
    } finally {
        Pop-Location
    }

    Write-Host "  Aguardando o PostgreSQL ficar pronto..." -ForegroundColor DarkGray
    $tentativas = 0
    $pronto = $false
    while ($tentativas -lt 30 -and -not $pronto) {
        Start-Sleep -Seconds 2
        $tentativas++
        $resultado = docker exec marmoraria-db pg_isready -U marmoraria -d marmoraria_db 2>&1
        if ($LASTEXITCODE -eq 0) { $pronto = $true }
        else { Write-Host "  ainda subindo... ($tentativas/30)" -ForegroundColor DarkGray }
    }

    if (-not $pronto) {
        Write-ErroFatal "PostgreSQL nao respondeu a tempo. Rode 'docker compose logs db' para investigar."
    }

    Write-Host "  PostgreSQL pronto (banco 'marmoraria_db' criado/disponivel)." -ForegroundColor Green
} else {
    Write-Step "Docker nao disponivel: pulando etapa automatica de banco."
    Write-Host "  Rode manualmente: .\windows\create-database.ps1" -ForegroundColor Yellow
    Write-Host "  (ajuste host/porta/usuario conforme sua instalacao local do PostgreSQL)" -ForegroundColor Yellow
}

# ----------------------------------------------------------------------------
# 3. Backend (Quarkus) em janela própria, com log em arquivo
# ----------------------------------------------------------------------------
Write-Step "Iniciando backend (Quarkus dev mode) em nova janela..."

$backendCmd = @"
Set-Location -Path '$BackendDir'
Write-Host 'Backend Quarkus - logs tambem gravados em $BackendLog' -ForegroundColor Cyan
mvn quarkus:dev 2>&1 | Tee-Object -FilePath '$BackendLog'
Write-Host ''
Write-Host 'Processo do backend finalizado. Pressione ENTER para fechar.' -ForegroundColor Yellow
Read-Host
"@

Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-Command', $backendCmd)

# ----------------------------------------------------------------------------
# 4. Frontend (React/Vite) em janela própria, com log em arquivo
# ----------------------------------------------------------------------------
Write-Step "Iniciando frontend (Vite dev server) em nova janela..."

$frontendCmd = @"
Set-Location -Path '$FrontendDir'
if (-not (Test-Path 'node_modules')) {
    Write-Host 'Instalando dependencias do frontend (npm install)...' -ForegroundColor Cyan
    npm install 2>&1 | Tee-Object -FilePath '$FrontendLog'
}
Write-Host 'Frontend Vite - logs tambem gravados em $FrontendLog' -ForegroundColor Cyan
npm run dev 2>&1 | Tee-Object -FilePath '$FrontendLog' -Append
Write-Host ''
Write-Host 'Processo do frontend finalizado. Pressione ENTER para fechar.' -ForegroundColor Yellow
Read-Host
"@

Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-Command', $frontendCmd)

# ----------------------------------------------------------------------------
# 4.5. App mobile (Expo) em janela própria, somente se -Mobile foi passado
# ----------------------------------------------------------------------------
if ($Mobile) {
    if (-not (Test-Path $MobileDir)) {
        Write-Host ""
        Write-Host "  [AVISO] Pasta mobile\ nao encontrada em $MobileDir — pulando." -ForegroundColor Yellow
    } else {
        Write-Step "Iniciando app mobile (Expo) em nova janela..."
        Write-Host "  Lembre-se de configurar o endereco da API em mobile\app.json (extra.apiBaseUrl)" -ForegroundColor Yellow
        Write-Host "  antes de escanear o QR Code no celular — veja mobile\README.md." -ForegroundColor Yellow

        $mobileCmd = @"
Set-Location -Path '$MobileDir'
if (-not (Test-Path 'node_modules')) {
    Write-Host 'Instalando dependencias do mobile (npm install)...' -ForegroundColor Cyan
    npm install 2>&1 | Tee-Object -FilePath '$MobileLog'
}
Write-Host 'App mobile (Expo) - logs tambem gravados em $MobileLog' -ForegroundColor Cyan
npx expo start 2>&1 | Tee-Object -FilePath '$MobileLog' -Append
Write-Host ''
Write-Host 'Processo do Expo finalizado. Pressione ENTER para fechar.' -ForegroundColor Yellow
Read-Host
"@

        Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-Command', $mobileCmd)
    }
}

# ----------------------------------------------------------------------------
# 5. Resumo
# ----------------------------------------------------------------------------
Write-Step "Tudo iniciado!"
Write-Host ""
Write-Host "  Backend (API):            http://localhost:8080/api" -ForegroundColor White
Write-Host "  Frontend:                 http://localhost:5173" -ForegroundColor White
if ($Mobile) {
    Write-Host "  Mobile (Expo):            QR Code exibido na janela do Expo (app Expo Go)" -ForegroundColor White
}
Write-Host ""
Write-Host "  Logs gravados em:" -ForegroundColor White
Write-Host "    $BackendLog"
Write-Host "    $FrontendLog"
if ($Mobile) {
    Write-Host "    $MobileLog"
}
Write-Host "    $DbLog"
Write-Host ""
Write-Host "  Para ACOMPANHAR OS ERROS em tempo real neste mesmo terminal," -ForegroundColor DarkGray
Write-Host "  sem precisar alternar de janela, rode em outro terminal:" -ForegroundColor DarkGray
Write-Host "    Get-Content -Path '$BackendLog' -Wait -Tail 50" -ForegroundColor DarkGray
Write-Host "    Get-Content -Path '$FrontendLog' -Wait -Tail 50" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Para PARAR tudo, rode: .\windows\stop-local.ps1" -ForegroundColor DarkGray
Write-Host ""

Start-Sleep -Seconds 3
try { Start-Process 'http://localhost:5173' } catch { }
