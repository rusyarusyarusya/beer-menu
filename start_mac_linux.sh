#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js не найден. Установите LTS: https://nodejs.org/"
  exit 1
fi

echo "Устанавливаю зависимости (если требуется)..."
npm install >/dev/null 2>&1 || true

echo "Запускаю сервер..."
( node server.js >/dev/null 2>&1 & )
# Небольшая пауза, чтобы сервер успел стартовать
sleep 1 || true

# Откроем браузер
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "http://localhost:3000" >/dev/null 2>&1 || true
fi

echo "Если браузер не открылся, перейдите по адресу: http://localhost:3000"
echo "Сервер запущен в фоне. Чтобы остановить его, перезапустите компьютер или закройте процесс node."