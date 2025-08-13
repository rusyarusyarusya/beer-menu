@echo off
setlocal
cd /d %~dp0

echo Проверяю Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js не найден. Пожалуйста, установите Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

echo Устанавливаю зависимости (если требуется)...
call npm install >nul 2>nul

echo Запускаю сервер...
start "HOP HOUSE Server" cmd /c "node server.js"
:: Подождём секунду, чтобы сервер поднялся
ping -n 2 127.0.0.1 > nul

start http://localhost:3000
echo Если браузер не открылся автоматически, зайдите на: http://localhost:3000

echo Нажмите любую клавишу, чтобы закрыть это окно...
pause > nul