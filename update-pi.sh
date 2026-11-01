#!/usr/bin/env bash
# Kamra & Fakanál — Automatikus Frissítő Script Raspberry Pi 4-re
# Biztonságosan frissít GitHub-ról anélkül, hogy a felvitt receptek elvesznének!
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

echo "=========================================================="
echo "  Kamra & Fakanál — Frissítés GitHub-ról                 "
echo "=========================================================="

# 1. Helyi adatbázis és receptek megőrzése (mentése ideiglenesen)
echo "[1/4] Helyi receptek (data/recipes.json) védelme..."
if [ -d "data" ]; then
  mkdir -p /tmp/kamra_backup
  cp -r data/* /tmp/kamra_backup/ 2>/dev/null || true
fi

# 2. Helyi módosítások félretétele a git elakadás elkerülésére
git stash --include-untracked 2>/dev/null || true

# 3. Legfrissebb verzió letöltése GitHub-ról
echo "[2/4] Legújabb kód letöltése GitHub-ról (git pull)..."
git pull origin main || git pull

# 4. Receptek visszaállítása
echo "[3/4] Receptek visszaállítása..."
if [ -d "/tmp/kamra_backup" ]; then
  mkdir -p data
  cp -r /tmp/kamra_backup/* data/ 2>/dev/null || true
fi

# 5. Webes felület újrafordítása és függőségek frissítése
echo "[4/4] Webes felület és virtuális környezet frissítése..."
if [ -d "venv" ]; then
  ./venv/bin/pip install -r requirements.txt --quiet
fi

if command -v npm >/dev/null 2>&1; then
  npm install --legacy-peer-deps --quiet
  npm run build
fi

# 6. Ha fut a háttérszolgáltatás, újraindítjuk
if systemctl is-active --quiet csaladi-recepttar-venv 2>/dev/null; then
  echo "Háttérszolgáltatás újraindítása..."
  sudo systemctl restart csaladi-recepttar-venv
fi

echo "=========================================================="
echo "  A frissítés sikeresen befejeződött!"
echo "  Aktuális verzió futtatása: ./run-venv.sh"
echo "=========================================================="
