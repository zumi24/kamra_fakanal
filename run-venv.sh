#!/usr/bin/env bash
# Kamra & Fakanál — Gyorsindító Python venv virtuális környezetből (Port: 5050)
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

if [ ! -f "venv/bin/python" ]; then
  echo "Hiba: A virtuális környezet még nincs létrehozva!"
  echo "Futtasd először a beállító scriptet:"
  echo "  ./setup-venv.sh"
  exit 1
fi

PORT="${PORT:-5050}"
export PORT="${PORT}"
export HOST="0.0.0.0"

echo "Indítás virtuális környezetből (venv): $(./venv/bin/python --version)"
echo "Helyi hálózati port: ${PORT}"

exec ./venv/bin/python app.py
