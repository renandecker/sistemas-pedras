<#
    create-database.ps1
    --------------------
    Cria o usuario/role e o banco 'marmoraria_db' num PostgreSQL JA INSTALADO
    localmente no Windows (use este script SOMENTE SE VOCE NAO ESTA usando
    Docker — se estiver usando Docker, o docker-compose.yml ja cria tudo
    automaticamente via start-local.ps1).

    Requer que o 'psql' esteja no PATH (instalado junto com o PostgreSQL,
    geralmente em C:\Program Files\PostgreSQL\<versao>\bin).

    Uso:
        .\windows\create-database.ps1
        .\windows\create-database.ps1 -PgHost localhost -PgPort 5432 -PgSuperUser postgres
#>

param(
    [string]$PgHost = 'localhost',
    [string]$PgPort = '5432',
    [string]$PgSuperUser = 'postgres',
    [string]$NovoUsuario = 'marmoraria',
    [string]$NovaSenha = 'marmoraria',
    [string]$NovoBanco = 'marmoraria_db'
)

# Não usamos 'Stop': o psql manda avisos (ex.: NOTICE) para o stderr, e com
# 'Stop' o PowerShell trataria isso como erro fatal. Cada chamada critica
# checa $LASTEXITCODE explicitamente em vez de depender de excecoes.
$ErrorActionPreference = 'Continue'

function Test-Comando($nome) {
    return [bool](Get-Command $nome -ErrorAction SilentlyContinue)
}

if (-not (Test-Comando 'psql')) {
    Write-Host "ERRO: 'psql' nao encontrado no PATH." -ForegroundColor Red
    Write-Host "Adicione a pasta 'bin' da sua instalacao do PostgreSQL ao PATH, por exemplo:" -ForegroundColor Yellow
    Write-Host "  C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Digite a senha do superusuario '$PgSuperUser' do PostgreSQL quando solicitado." -ForegroundColor Cyan
Write-Host "    (host=$PgHost porta=$PgPort)" -ForegroundColor DarkGray

$sql = @"
DO `$`$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$NovoUsuario') THEN
      CREATE ROLE $NovoUsuario LOGIN PASSWORD '$NovaSenha';
   END IF;
END
`$`$;
"@

$sqlFile = Join-Path $env:TEMP 'marmoraria_create_role.sql'
Set-Content -Path $sqlFile -Value $sql -Encoding UTF8

Write-Host "==> Criando role '$NovoUsuario' (se ainda nao existir)..." -ForegroundColor Cyan
& psql -h $PgHost -p $PgPort -U $PgSuperUser -d postgres -f $sqlFile
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao criar a role. Veja a mensagem acima." -ForegroundColor Red; exit 1 }

Write-Host "==> Verificando/criando o banco '$NovoBanco'..." -ForegroundColor Cyan
$bancoExiste = & psql -h $PgHost -p $PgPort -U $PgSuperUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$NovoBanco'"
if ($bancoExiste -match '1') {
    Write-Host "  Banco '$NovoBanco' ja existe, nada a fazer." -ForegroundColor Green
} else {
    & psql -h $PgHost -p $PgPort -U $PgSuperUser -d postgres -c "CREATE DATABASE $NovoBanco OWNER $NovoUsuario;"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao criar o banco. Veja a mensagem acima." -ForegroundColor Red; exit 1 }
    Write-Host "  Banco '$NovoBanco' criado com sucesso." -ForegroundColor Green
}

Remove-Item $sqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==> Pronto. Configure (ou confirme) as variaveis de ambiente do backend:" -ForegroundColor Cyan
Write-Host "    DB_URL      = jdbc:postgresql://${PgHost}:${PgPort}/${NovoBanco}"
Write-Host "    DB_USER     = $NovoUsuario"
Write-Host "    DB_PASSWORD = $NovaSenha"
Write-Host ""
Write-Host "  Esses ja sao os valores padrao em backend\src\main\resources\application.properties." -ForegroundColor DarkGray
