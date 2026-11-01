/**
 * Kamra & Fakanál — Alkalmazás verziókövetés
 * Minden új fejlesztésnél és módosításnál növelt verziószám.
 */

export const APP_VERSION = 'v1.2.0';
export const APP_VERSION_NUMBER = '1.2.0';
export const APP_RELEASE_DATE = '2026. november 1.';

export interface VersionHistoryItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionHistoryItem[] = [
  {
    version: 'v1.2.0',
    date: '2026. november 1.',
    title: 'Egyéni saját kategóriák hozzáadása',
    changes: [
      'Új recept rögzítésekor közvetlenül létrehozható egyedi kategória (+ Saját kategória hozzáadása)',
      'Az új kategóriák azonnal bekerülnek a főkategória-szűrők közé és a receptkártyákra',
      'Kategóriánkénti receptszámláló automatikus frissülése az egyéni kategóriákra is',
      'Helyi és szerver oldali kategória-megőrzés',
    ],
  },
  {
    version: 'v1.1.1',
    date: '2026. november 1.',
    title: 'Raspberry Pi npm függőség javítás (.npmrc & legacy-peer-deps)',
    changes: [
      'Peer dependency ütközés (ERESOLVE) feloldása esbuild és vite között a Raspberry Pi-n',
      'Automatikus --legacy-peer-deps beállítás a setup-venv.sh scriptben',
      '.npmrc konfigurációs fájl hozzáadása a zökkenőmentes Pi telepítéshez',
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026. november 1.',
    title: 'Virtuális környezet (venv) & Ütközésmentes 5050-es port',
    changes: [
      'Python 3 venv (virtuális környezet) támogatás Raspberry Pi 4-re',
      'Új alapértelmezett, ütközésmentes 5050-es port beállítása',
      'Dinamikus port-beállító felület terminálparancs-generálással',
      'Verziószámozási rendszer és változásnapló ablak bevezetése',
      'Automata indító scriptek (setup-venv.sh, run-venv.sh, install-pi-venv.sh)',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026. október 31.',
    title: 'Első kiadás (Kezdeti receptadatbázis)',
    changes: [
      'Képes családi recepttár hiteles magyar receptkínálattal',
      'Kategóriaszűrők, keresés és elkészítési idő szűrés',
      'Dinamikus adagkalkulátor és interaktív munkafázis pipálás',
      'A4-es nyomtatható receptkártya és HTML exportálás',
      'Heti családi menütervező és összesített bevásárlólista',
      'Raspberry Pi 4 webszerver integráció JSON adatbázissal',
    ],
  },
];
