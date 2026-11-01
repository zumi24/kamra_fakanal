#!/usr/bin/env bash
# Kamra & Fakanál — Raspberry Pi 4 Telepítő Script (venv alapú futtatás)
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${DIR}"
chmod +x install-pi-venv.sh
exec ./install-pi-venv.sh
