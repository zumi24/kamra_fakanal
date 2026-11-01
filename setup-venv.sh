#!/usr/bin/env bash
# Kamra & Fakanál — Automatikus Python venv előkészítő és indító script (Port: 5050)
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

PORT="${PORT:-5050}"

echo "=========================================================="
echo "  Kamra & Fakanál — Python venv Virtuális Környezet      "
echo "  Beállított Port: ${PORT} (Raspberry Pi 4 / Helyi Wi-Fi)"
echo "=========================================================="

# 1. Ellenőrizzük a python3-venv csomagot
if ! python3 -m venv --help >/dev/null 2>&1; then
  echo "[1/4] python3-venv telepítése (szükséges lehet a jelszavad)..."
  sudo apt-get update && sudo apt-get install -y python3-venv python3-pip
fi

# 2. Virtuális környezet (venv) létrehozása
if [ ! -d "venv" ]; then
  echo "[2/4] Virtuális környezet (venv) létrehozása a projektben..."
  python3 -m venv venv
else
  echo "[2/4] Virtuális környezet (venv) már létezik."
fi

# 3. Függőségek telepítése a venv-be
echo "[3/4] Python csomagok telepítése a venv-be (Flask, CORS, Gunicorn)..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# 4. Webes felület lefordítása, ha még nincs dist mappa
if [ ! -d "dist" ]; then
  echo "[4/4] Webes felület (React) lefordítása..."
  if command -v npm >/dev/null 2>&1; then
    npm install --legacy-peer-deps
    npm run build
  else
    echo "Figyelem: Az npm nem található, de a dist mappa nélkül a felület nem jelenik meg."
    echo "Telepítés: sudo apt-get install -y nodejs npm"
  fi
else
  echo "[4/4] A dist webes mappa már készen áll."
fi

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
echo "=========================================================="
echo "  A virtuális környezet (venv) sikeresen beállítva!"
echo "  Indítás venv-ből: ./run-venv.sh"
echo "  Hálózati elérés: http://${LOCAL_IP}:${PORT}"
echo "=========================================================="

# Azonnali indítás
export PORT="${PORT}"
export HOST="0.0.0.0"
./venv/bin/python app.py
