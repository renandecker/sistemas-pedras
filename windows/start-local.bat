@echo off
REM Wrapper para permitir "duplo clique" no Windows.
REM Chama o start-local.ps1 liberando a politica de execucao apenas para este processo.
REM Qualquer argumento passado aqui (ex.: start-local.bat -Mobile) e repassado ao script.

setlocal
set SCRIPT_DIR=%~dp0

echo ==========================================================
echo  Sistema de Gestao para Marmoraria - Inicializacao (Windows)
echo ==========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-local.ps1" %*

echo.
echo Se as janelas de backend/frontend nao abriram, verifique mensagens de erro acima.
pause
