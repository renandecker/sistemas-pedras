<#
    stop-local.ps1
    ---------------
    Para o PostgreSQL (docker compose) e finaliza os processos de backend
    (mvn/java do Quarkus) e frontend (node/vite) iniciados por start-local.ps1.

    Uso:
        .\windows\stop-local.ps1
#>

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir

Write-Host "==> Parando containers do PostgreSQL (docker compose down)..." -ForegroundColor Cyan
Push-Location $RootDir
docker compose down
Pop-Location

Write-Host "==> Finalizando processos do backend (Quarkus/Java) na porta 8080..." -ForegroundColor Cyan
$pidBackend = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
if ($pidBackend) {
    Stop-Process -Id $pidBackend -Force
    Write-Host "  Processo $pidBackend finalizado." -ForegroundColor Green
} else {
    Write-Host "  Nenhum processo escutando na porta 8080." -ForegroundColor DarkGray
}

Write-Host "==> Finalizando processos do frontend (Vite/Node) na porta 5173..." -ForegroundColor Cyan
$pidFrontend = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
if ($pidFrontend) {
    Stop-Process -Id $pidFrontend -Force
    Write-Host "  Processo $pidFrontend finalizado." -ForegroundColor Green
} else {
    Write-Host "  Nenhum processo escutando na porta 5173." -ForegroundColor DarkGray
}

Write-Host "==> Finalizando processo do app mobile (Expo/Metro) na porta 8081, se houver..." -ForegroundColor Cyan
$pidMobile = (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
if ($pidMobile) {
    Stop-Process -Id $pidMobile -Force
    Write-Host "  Processo $pidMobile finalizado." -ForegroundColor Green
} else {
    Write-Host "  Nenhum processo escutando na porta 8081 (Expo nao estava rodando ou usa outra porta)." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "==> Concluido. As janelas do backend/frontend/mobile podem ser fechadas manualmente." -ForegroundColor Cyan
