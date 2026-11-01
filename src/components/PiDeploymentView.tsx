import React, { useState, useRef } from 'react';
import {
  Server,
  Copy,
  Check,
  Download,
  Upload,
  Terminal,
  GitBranch,
  HardDrive,
  Layers,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { Recipe, ServerStatusInfo } from '../types/recipe';

interface PiDeploymentViewProps {
  recipes: Recipe[];
  serverInfo: ServerStatusInfo | null;
  onImportRecipes: (imported: Recipe[]) => Promise<void>;
}

export const PiDeploymentView: React.FC<PiDeploymentViewProps> = ({
  recipes,
  serverInfo,
  onImportRecipes,
}) => {
  const [activeDeployMode, setActiveDeployMode] = useState<'venv' | 'node' | 'docker'>('venv');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportDatabase = () => {
    const json = JSON.stringify(recipes, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csaladi-receptek-adatbazis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        if (Array.isArray(parsed) && parsed.length > 0) {
          await onImportRecipes(parsed);
          setImportMessage(`Sikeresen betöltve ${parsed.length} db recept az adatbázisba!`);
        } else {
          setImportMessage('A kiválasztott JSON fájl nem tartalmaz érvényes receptlistát.');
        }
      } catch {
        setImportMessage('Hibás JSON fájlformátum.');
      }
    };
    reader.readAsText(file);
  };

  // Commands strings
  const venvCommands = `# 1. Python virtuális környezet (venv) létrehozása és aktiválása
python3 -m venv venv
source venv/bin/activate

# 2. Csomagok telepítése az izolált venv-be
pip install --upgrade pip
pip install -r requirements.txt

# 3. Webes felület lefordítása (ha még nincs dist mappa)
npm install && npm run build

# 4. Szerver indítása az 5000-es porton (a venv-ből)
PORT=5000 python app.py`;

  const venvOneLiner = `# Automatikus mindent-egyben beállítás és indítás:
chmod +x setup-venv.sh
./setup-venv.sh

# Későbbi gyorsindítás a venv-ből egyetlen paranccsal:
./run-venv.sh

# Vagy automatikus háttérszolgáltatásként (rendszerinduláskor indul):
chmod +x install-pi-venv.sh
./install-pi-venv.sh`;

  const githubCommands = `# 1. Töltsd fel a kódot saját GitHub repóba
git init
git add .
git commit -m "Kamra es Fakanal csaladi recepttar (Python venv + Pi 4)"
git branch -M main
git remote add origin https://github.com/FELHASZNALONEV/csaladi-recepttar.git
git push -u origin main

# 2. Raspberry Pi 4-en klónozd le:
git clone https://github.com/FELHASZNALONEV/csaladi-recepttar.git
cd csaladi-recepttar`;

  const nodeCommands = `# Node.js natív futtatás (ha nem Python venv-et használsz)
npm install
npm run build
PORT=5000 NODE_ENV=production npm start`;

  const dockerCommands = `# Docker Compose futtatás (konténeres izoláció)
docker compose up -d --build
# A receptek megmaradnak a helyi data/ mappában`;

  return (
    <div className="space-y-8">
      {/* Header Summary Card */}
      <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-[#78716C] mb-2">
            <span>Raspberry Pi 4 Otthoni Kiszolgáló</span>
            <span aria-hidden="true">·</span>
            <span>Python 3 venv / Node.js / Docker</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num font-semibold text-[#B93829]">Port: 5000</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Virtuális Futtatás (venv) &amp; Raspberry Pi 4 Telepítés
          </h1>

          <p className="text-sm sm:text-base text-[#57534E] mt-2 leading-relaxed">
            A legújabb Raspberry Pi OS (Debian 12 Bookworm) a biztonságos, izolált Python csomagkezeléshez
            megköveteli a <strong>virtuális környezet (venv)</strong> használatát. Az alkalmazáshoz elkészítettük a
            teljes Python Flask backendet (<span className="font-mono-num text-[#1C1917]">app.py</span>), a{' '}
            <span className="font-mono-num text-[#1C1917]">requirements.txt</span>-t és az automatikus{' '}
            <span className="font-mono-num text-[#1C1917]">setup-venv.sh</span> scriptet, így a Pi-n semmilyen rendszerszintű
            csomagütközés nem fordulhat elő.
          </p>
        </div>

        {/* Technical Spec Row */}
        <div className="mt-6 pt-6 border-t border-[#E7E2DA] grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
            <div className="text-xs text-[#78716C]">Hálózati Célport</div>
            <div className="font-mono-num text-lg font-bold text-[#B93829] mt-1">
              0.0.0.0:5000
            </div>
            <div className="text-xs text-[#57534E] mt-0.5">
              http://raspberrypi.local:5000
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
            <div className="text-xs text-[#78716C]">Virtuális Környezet</div>
            <div className="font-mono-num text-base font-semibold text-[#1C1917] mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#3F624D]" />
              Python 3 venv
            </div>
            <div className="text-xs text-[#57534E] mt-0.5">
              Izolált, ütközésmentes futás
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
            <div className="text-xs text-[#78716C]">Adatbázis Állomány</div>
            <div className="font-mono-num text-base font-semibold text-[#1C1917] mt-1">
              data/recipes.json
            </div>
            <div className="text-xs text-[#57534E] mt-0.5">
              Automatikus mentés ({recipes.length} recept)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
            <div className="text-xs text-[#78716C]">Systemd Szolgáltatás</div>
            <div className="font-mono-num text-base font-semibold text-[#1C1917] mt-1">
              csaladi-recepttar-venv
            </div>
            <div className="text-xs text-[#57534E] mt-0.5">
              Indulás újraindításkor
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-[#E7E2DA] rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveDeployMode('venv')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeDeployMode === 'venv'
              ? 'bg-[#1C1917] text-white shadow-xs'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#B93829]" />
          Python venv (Kért virtuális futtatás)
        </button>

        <button
          type="button"
          onClick={() => setActiveDeployMode('node')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeDeployMode === 'node'
              ? 'bg-[#1C1917] text-white shadow-xs'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Server className="w-4 h-4 text-[#78716C]" />
          Node.js natív
        </button>

        <button
          type="button"
          onClick={() => setActiveDeployMode('docker')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeDeployMode === 'docker'
              ? 'bg-[#1C1917] text-white shadow-xs'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#78716C]" />
          Docker Compose
        </button>
      </div>

      {/* Content depending on selected mode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {activeDeployMode === 'venv' ? (
            <>
              {/* Step 1: GitHub */}
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GitBranch className="w-4 h-4 text-[#B93829]" />
                    <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                      01. Feltöltés GitHub-ra és letöltés a Pi 4-re
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('github', githubCommands)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:bg-[#F3EFEA]"
                  >
                    {copiedKey === 'github' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3F624D]" />
                        Másolva
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Másolás
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-lg bg-[#1C1917] text-[#FAF8F5] font-mono-num text-xs overflow-x-auto leading-relaxed">
                  {githubCommands}
                </pre>
              </div>

              {/* Step 2: Virtual Environment (venv) Setup */}
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-4 h-4 text-[#B93829]" />
                    <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                      02. Futtatás virtuális környezetben (Python venv)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('venv', venvCommands)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:bg-[#F3EFEA]"
                  >
                    {copiedKey === 'venv' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3F624D]" />
                        Másolva
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Parancsok másolása
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed">
                  A következő parancsok létrehozzák az izolált <span className="font-mono-num text-[#1C1917]">venv</span> mappát,
                  telepítik a <span className="font-mono-num text-[#1C1917]">requirements.txt</span> csomagjait (Flask, CORS, Gunicorn),
                  majd elindítják az alkalmazást az 5000-es porton:
                </p>

                <pre className="p-4 rounded-lg bg-[#1C1917] text-[#FAF8F5] font-mono-num text-xs overflow-x-auto leading-relaxed">
                  {venvCommands}
                </pre>
              </div>

              {/* Step 3: Scripts & Systemd for venv */}
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-[#B93829]" />
                    <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                      03. Kényelmi automatizáló scriptek (Beépítve a repóban)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('oneliner', venvOneLiner)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:bg-[#F3EFEA]"
                  >
                    {copiedKey === 'oneliner' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3F624D]" />
                        Másolva
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Másolás
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed">
                  Hogy ne kelljen manuálisan gépelned a lépéseket, a projekt gyökerében készen áll a három dedikált venv script:
                </p>

                <pre className="p-4 rounded-lg bg-[#1C1917] text-[#FAF8F5] font-mono-num text-xs overflow-x-auto leading-relaxed">
                  {venvOneLiner}
                </pre>
              </div>
            </>
          ) : activeDeployMode === 'node' ? (
            <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-[#B93829]" />
                  <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                    Node.js 20 LTS futtatás (tsx / server.ts)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('node', nodeCommands)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:bg-[#F3EFEA]"
                >
                  {copiedKey === 'node' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#3F624D]" />
                      Másolva
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Másolás
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-lg bg-[#1C1917] text-[#FAF8F5] font-mono-num text-xs overflow-x-auto leading-relaxed">
                {nodeCommands}
              </pre>
            </div>
          ) : (
            <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#B93829]" />
                  <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                    Docker Compose Futtatás (Port 5000)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('docker', dockerCommands)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:bg-[#F3EFEA]"
                >
                  {copiedKey === 'docker' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#3F624D]" />
                      Másolva
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Másolás
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-lg bg-[#1C1917] text-[#FAF8F5] font-mono-num text-xs overflow-x-auto leading-relaxed">
                {dockerCommands}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Database Backup / Restore & Network Access Guide */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-[#B93829]" />
              <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                Adatbázis Mentés &amp; Visszatöltés
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              Minden recept a <span className="font-mono-num text-[#1C1917]">data/recipes.json</span> fájlba mentődik.
              Bármikor letöltheted egyetlen JSON állományként, és a Pi 4-en futó szerverre azonnal visszatöltheted.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportDatabase}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium bg-[#1C1917] text-white rounded-lg hover:bg-[#292524] transition-colors"
              >
                <Download className="w-4 h-4" />
                Adatbázis letöltése (.json)
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] text-[#1C1917] rounded-lg hover:bg-[#F3EFEA] transition-colors"
              >
                <Upload className="w-4 h-4" />
                JSON visszatöltése
              </button>
            </div>

            {importMessage && (
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-xs font-medium text-[#1C1917]">
                {importMessage}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-[#B93829]" />
              <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                Hálózati elérés a lakásban (Wi-Fi)
              </h2>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#57534E] leading-relaxed">
              <li>
                <strong className="text-[#1C1917]">1. Helyi IP cím alapján:</strong> nyisd meg bármely
                otthoni Wi-Fi-re csatlakozott telefonon vagy konyhai tableten a{' '}
                <span className="font-mono-num text-[#1C1917]">http://192.168.1.X:5000</span> címet.
              </li>
              <li>
                <strong className="text-[#1C1917]">2. mDNS névvel:</strong> amennyiben a Raspberry Pi
                alapértelmezett hostneve aktív, közvetlenül elérhető a{' '}
                <span className="font-mono-num text-[#1C1917]">http://raspberrypi.local:5000</span> címen.
              </li>
              <li>
                <strong className="text-[#1C1917]">3. Konyhai könyvjelző:</strong> iOS és Android
                böngészőben válaszd a „Hozzáadás a kezdőképernyőhöz” opciót, így teljes képernyős
                családi szakácskönyvként nyílik meg.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
