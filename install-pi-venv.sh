#!/usr/bin/env bash
# Kamra & Fakanál — Raspberry Pi 4 venv Systemd háttérszolgáltatás telepítő
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="csaladi-recepttar-venv"
USER_NAME="${USER:-pi}"

echo "=============================================================="
echo "  Raspberry Pi 4 Automatikus Háttérszolgáltatás (venv)       "
echo "  Szolgáltatás neve: ${SERVICE_NAME}.service                  "
echo "  Port: 5000 (Indulás bekapcsoláskor)                         "
echo "=============================================================="

cd "${APP_DIR}"

if [ ! -f "venv/bin/python" ]; then
  echo "Először felépítjük a virtuális környezetet..."
  chmod +x setup-venv.sh
  ./setup-venv.sh
fi

echo "Systemd szolgáltatásfájl létrehozása..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Kamra es Fakanal Csaladi Recepttar Python venv Szerver (Port 5000)
After=network.target

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${APP_DIR}
Environment=PORT=5000
Environment=HOST=0.0.0.0
Environment=PYTHONUNBUFFERED=1
ExecStart=${APP_DIR}/venv/bin/python ${APP_DIR}/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
echo "=============================================================="
echo "  A systemd háttérszolgáltatás sikeresen elindult!"
echo "  A Raspberry Pi újraindításakor is magától elindul a venv-ből."
echo "  Elérés a hálózaton: http://${LOCAL_IP}:5000"
echo "  Állapot lekérdezése: sudo systemctl status ${SERVICE_NAME}"
echo "=============================================================="
