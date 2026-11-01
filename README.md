# Kamra & Fakanál — Családi Recepttár (Raspberry Pi 4 · Python venv · Port 5000)

Platformfüggetlen családi receptadatbázis és helyi hálózati webszerver, amelyet kifejezetten **Raspberry Pi 4-en való virtuális futtatásra (Python `venv`)**, valamint otthoni Wi-Fi hálózati kiszolgálásra (5000-es port) terveztünk.

---

## 🌟 Virtuális futtatás Python venv-ben (Ajánlott Raspberry Pi 4-re)

A modern Raspberry Pi OS (Debian 12 Bookworm) a rendszer stabilitásának megőrzése érdekében megköveteli a virtuális környezetek (`venv`) használatát a külső Python csomagokhoz.

### 1. Lépés: Letöltés GitHub-ról a Raspberry Pi-re
```bash
git clone https://github.com/FELHASZNALONEV/csaladi-recepttar.git
cd csaladi-recepttar
```

### 2. Lépés: Automatikus venv beállítás és indítás (Egy paranccsal)
A repóban előkészítettünk egy automatizáló scriptet:
```bash
chmod +x setup-venv.sh run-venv.sh install-pi-venv.sh
./setup-venv.sh
```
A script:
1. Létrehozza az izolált `venv` virtuális környezetet (`python3 -m venv venv`)
2. Telepíti a függőségeket a venv-be (`pip install -r requirements.txt`)
3. Lefordítja a modern webes felületet (`npm run build`)
4. Elindítja a Flask webszervert a venv-ből az **5000-es porton**.

---

### 3. Lépés: Manuális venv parancsok (ha lépésről lépésre szeretnéd)
Ha manuálisan szeretnéd futtatni:
```bash
# 1. Virtuális környezet létrehozása és bekapcsolása:
python3 -m venv venv
source venv/bin/activate

# 2. Csomagok telepítése a virtuális környezetbe:
pip install --upgrade pip
pip install -r requirements.txt

# 3. Webes felület lefordítása (ha még nincs dist mappa):
npm install
npm run build

# 4. Szerver indítása az 5000-es porton:
PORT=5000 python app.py
```

Bármikor újraindíthatod a venv-ből a gyorsindítóval:
```bash
./run-venv.sh
```

---

### 4. Lépés: Automatikus indítás bekapcsoláskor (Systemd háttérszolgáltatás)
Ha szeretnéd, hogy a Raspberry Pi 4 bekapcsolásakor vagy újraindulásakor a családi recepttár magától elinduljon a háttérben a `venv`-ből:
```bash
./install-pi-venv.sh
```
Ez regisztrálja a `csaladi-recepttar-venv.service` szolgáltatást a systemd-ben.
Ellenőrizheted a működést:
```bash
sudo systemctl status csaladi-recepttar-venv
```

---

## 📱 Elérés a lakásban telefonról és tabletről

Miután a szerver elindult a Raspberry Pi-n, nyisd meg bármely otthoni Wi-Fi-re kapcsolt eszközről:
* **Helyi IP cím alapján:** `http://192.168.1.X:5000` (ahol az X a Pi címe a routeren)
* **mDNS név alapján:** `http://raspberrypi.local:5000`

> 💡 **Konyhai tipp:** Nyisd meg a telefont vagy a konyhai falra/pultra kitett tabletet a fenti címen, majd a böngésző menüjében válaszd a **„Hozzáadás a kezdőképernyőhöz”** lehetőséget. Így teljes képernyős, érintőbarát konyhai szakácskönyvként használható.

---

## 💾 Adatbázis és Mentés
Minden recept, kép és heti menü a `data/recipes.json` és `data/mealPlan.json` fájlokban tárolódik.
A webes felület **Pi 4 & venv** fülén található **„Adatbázis letöltése (.json)”** és **„JSON visszatöltése”** gombokkal a teljes családi receptgyűjtemény egyetlen fájlban biztonsági menthető vagy költöztethető.
