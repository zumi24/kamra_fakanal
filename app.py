#!/usr/bin/env python3
"""
Kamra & Fakanál — Családi Recepttár Python Flask Webszerver (Port: 5000)
Kifejezetten Raspberry Pi 4-en való futtatásra virtuális környezetben (venv).
"""

import os
import sys
import json
import socket
import platform
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")
RECIPES_FILE = os.path.join(DATA_DIR, "recipes.json")
MEAL_PLAN_FILE = os.path.join(DATA_DIR, "mealPlan.json")
DIST_DIR = os.path.join(APP_DIR, "dist")
IMAGES_DIR = os.path.join(APP_DIR, "src", "assets", "images")

DEFAULT_RECIPES = [
  {
    "id": "nagymama-gulyaslevese",
    "title": "Nagymama bográcsos marhagulyása csipetkével",
    "subtitle": "Sűrű, tüzesen paprikás családi gulyásleves marhalábszárból, lassú tűzön főzve, házi gyúrt csipetkével.",
    "category": "Levesek",
    "author": "Ilonka nagymama",
    "prepTimeMinutes": 35,
    "cookTimeMinutes": 140,
    "servings": 6,
    "difficulty": "Hagyományos",
    "imageUrl": "/src/assets/images/gulyas_leves_hero_1793515497417.jpg",
    "isFavorite": True,
    "familyTip": "A fűszerpaprikát mindig a tűzről lehúzva keverjük a hagymás alaphoz, majd azonnal öntsünk rá egy kevés hideg vizet, így sosem keseredik meg, és gyönyörű mélyvörös színt ad a zsírnak.",
    "createdAt": "2026-09-14",
    "ingredients": [
      { "id": "g-1", "amount": 800, "unit": "g", "name": "marhalábszár", "note": "2 cm-es kockákra vágva" },
      { "id": "g-2", "amount": 3, "unit": "db", "name": "nagy vöröshagyma", "note": "finomra aprítva" },
      { "id": "g-3", "amount": 2, "unit": "ek", "name": "sertészsír", "note": "házi mangalica vagy sertészsír" },
      { "id": "g-4", "amount": 2.5, "unit": "ek", "name": "kalocsai édes nemes fűszerpaprika" },
      { "id": "g-5", "amount": 4, "unit": "gerezd", "name": "fokhagyma", "note": "zúzva" },
      { "id": "g-6", "amount": 1, "unit": "tk", "name": "őrölt köménymag" },
      { "id": "g-7", "amount": 3, "unit": "db", "name": "sárgarépa", "note": "karikázva" },
      { "id": "g-8", "amount": 2, "unit": "db", "name": "fehérrépa", "note": "hasábokra vágva" },
      { "id": "g-9", "amount": 600, "unit": "g", "name": "sárga héjú burgonya", "note": "kockázva" },
      { "id": "g-10", "amount": 1, "unit": "db", "name": "tv paprika és 1 db paradicsom" },
      { "id": "g-11", "amount": 1, "unit": "db", "name": "tojás és 100 g liszt", "note": "a házi csipetkéhez" },
      { "id": "g-12", "amount": 1, "unit": "csokor", "name": "friss petrezselyemzöld" }
    ],
    "steps": [
      "A sertészsírt vastag aljú lábasban vagy bográcsban felolvasztjuk, majd a finomra vágott vöröshagymát alacsony lángon, csipet sóval 12–15 perc alatt üvegesre és aranysárgára dinszteljük.",
      "Lehúzzuk az edényt a tűzről, megszórjuk az édes nemes fűszerpaprikával és az őrölt köménnyel, elkeverjük, majd azonnal rádobjuk a kockázott marhalábszárat.",
      "Visszatesszük a tűzre, hozzáadjuk a zúzott fokhagymát, a félbevágott paradicsomot és paprikát, majd a húst saját levében, fedő alatt 70–80 percig puhára pároljuk, közben szükség szerint kevés forró vizet pótolva.",
      "Amikor a marhahús már félig megpuhult, hozzáadjuk a sárgarépát, a fehérrépát és a zellerzöldet, majd felöntjük kb. 2,2 liter forró vízzel.",
      "További 25 perc főzés után beleforgatjuk a kockázott burgonyát. Közben a tojásból, lisztből és csipet sóból kemény tésztát gyúrunk, majd borsónyi csipetkéket csipkedünk a lobogó levesbe.",
      "Amikor a csipetke feljön a leves tetejére és a burgonya is vajasra puhult, friss aprított petrezselyemmel megszórva, ropogós kovászos kenyérrel tálaljuk."
    ]
  },
  {
    "id": "vasarnapi-csirkepaprikas-nokedlivel",
    "title": "Vasárnapi csirkepaprikás házi szaggatott nokedlivel",
    "subtitle": "Bársonyosan sűrű, tejfölös-paprikás szaftban omlósra főtt csirkecombok, frissen szaggatott vajas galuskával.",
    "category": "Főételek",
    "author": "Anya konyhája",
    "prepTimeMinutes": 25,
    "cookTimeMinutes": 55,
    "servings": 4,
    "difficulty": "Könnyű",
    "imageUrl": "/src/assets/images/csirkepaprikas_nokedli_1793515498220.jpg",
    "isFavorite": True,
    "familyTip": "A habaráshoz használt tejfölt mindig hőkiegyenlítsük: merjünk hozzá 2-3 evőkanál forró paprikás szaftot a tálkába, keverjük simára, és csak ezután öntsük vissza a lábasba — így sosem csapódik ki.",
    "createdAt": "2026-09-20",
    "ingredients": [
      { "id": "c-1", "amount": 4, "unit": "db", "name": "egész tanyasi csirkecomb", "note": "alsó és felső részre bontva" },
      { "id": "c-2", "amount": 2, "unit": "db", "name": "nagy vöröshagyma", "note": "apróra vágva" },
      { "id": "c-3", "amount": 2, "unit": "ek", "name": "kacsazsír vagy napraforgóolaj" },
      { "id": "c-4", "amount": 2, "unit": "ek", "name": "édes nemes fűszerpaprika" },
      { "id": "c-5", "amount": 1, "unit": "db", "name": "lecsópaprika és 1 db érett paradicsom" },
      { "id": "c-6", "amount": 250, "unit": "g", "name": "20%-os tejföl", "note": "szobahőmérsékletű" },
      { "id": "c-7", "amount": 1, "unit": "ek", "name": "finomliszt", "note": "a sűrítéshez" },
      { "id": "c-8", "amount": 400, "unit": "g", "name": "finomliszt", "note": "a nokedlihez" },
      { "id": "c-9", "amount": 3, "unit": "db", "name": "tojás", "note": "a nokedlihez" }
    ],
    "steps": [
      "A csirkecombokat sózzuk, majd a felhevített zsiradékon mindkét oldalukat 3–4 perc alatt aranybarnára pirítjuk, és ideiglenesen kivesszük egy tányérra.",
      "A visszamaradt zsíron megdinszteljük az apróra vágott vöröshagymát, hozzáadjuk a kockázott paradicsomot és paprikát, majd lepirítjuk, amíg krémes alapot kapunk.",
      "Lehúzzuk a tűzről, elkeverjük benne a fűszerpaprikát, visszahelyezzük a csirkecombokat, felöntjük 2,5 dl vízzel, és fedő alatt, alacsony lángon 40 perc alatt omlósra pároljuk.",
      "Közben a nokedlihez a lisztet, a tojásokat, 1 teáskanál sót és kb. 1,8 dl vizet fakanállal gyors mozdulatokkal összedolgozunk, majd lobogó sós vízbe szaggatjuk.",
      "A megfőtt csirkecombokat kivesszük a szaftból. A tejfölt csomómentesre keverjük 1 evőkanál liszttel és két merőkanál forró szafttal, majd folyamatos keverés mellett a mártáshoz adjuk és 2 perc alatt kiforraljuk.",
      "A combokat visszaforgatjuk a bársonyos paprikás mártásba, és a friss nokedlivel, petrezselyemmel megszórva tálaljuk."
    ]
  },
  {
    "id": "bekebeli-turogomboc",
    "title": "Békebeli pirított morzsás túrógombóc",
    "subtitle": "Pihekönnyű, búzadarával pihentetett rögös túrógombócok vajon pirított aranybarna prézliben, fahéjas tejföllel.",
    "category": "Desszertek",
    "author": "Ilonka nagymama",
    "prepTimeMinutes": 45,
    "cookTimeMinutes": 15,
    "servings": 4,
    "difficulty": "Könnyű",
    "imageUrl": "/src/assets/images/turogomboc_desszert_1793515502842.jpg",
    "isFavorite": True,
    "familyTip": "A titok a pihentetés és a felvert tojásfehérje: a túrós-búzadarával összekevert masszát legalább 40 percig hagyjuk a hűtőben állni, hogy a dara megszívja magát, így főzéskor sosem esik szét a gombóc.",
    "createdAt": "2026-10-02",
    "ingredients": [
      { "id": "t-1", "amount": 500, "unit": "g", "name": "félzsíros rögös tehéntúró", "note": "villával áttörve" },
      { "id": "t-2", "amount": 100, "unit": "g", "name": "búzadara" },
      { "id": "t-3", "amount": 3, "unit": "db", "name": "tojás", "note": "szétválasztva" },
      { "id": "t-4", "amount": 1, "unit": "db", "name": "kezeletlen citrom reszelt héja" },
      { "id": "t-5", "amount": 1, "unit": "csomag", "name": "vaníliás cukor" },
      { "id": "t-6", "amount": 120, "unit": "g", "name": "zsemlemorzsa", "note": "a forgatáshoz" },
      { "id": "t-7", "amount": 50, "unit": "g", "name": "vaj", "note": "a morzsa pirításához" },
      { "id": "t-8", "amount": 250, "unit": "g", "name": "tejföl és porcukor", "note": "a tálaláshoz" }
    ],
    "steps": [
      "A rögös túrót villával alaposan áttörjük, hozzáadjuk a tojások sárgáját, a búzadarát, a vaníliás cukrot, a reszelt citromhéjat és egy csipet sót.",
      "A tojásfehérjéket kemény habbá verjük, majd óvatosan, két részletben beleforgatjuk a túrós alapba. Lefedve 45 percre hűtőbe tesszük pihenni.",
      "Egy széles serpenyőben felolvasztjuk a vajat, és a zsemlemorzsát közepes lángon, folyamatosan kevergetve aranybarnára és illatosra pirítjuk.",
      "Bő, enyhén sós vizet forralunk. Nedves kézzel diónyinál nagyobb gombócokat formázunk a túrómasszából, és a gyöngyözve fövő vízbe tesszük őket.",
      "Amikor a gombócok feljönnek a víz felszínére, még 3–4 percig csendesen főzzük őket, majd szűrőkanállal egyenesen a vajas pirított morzsába szedjük.",
      "A serpenyőt rázogatva minden oldalukat bevonjuk a ropogós morzsával. Hideg tejföllel és porcukorral meghintve, melegen tálaljuk."
    ]
  },
  {
    "id": "hortobagyi-husos-palacsinta",
    "title": "Hortobágyi húsos palacsinta paprikás-tejfölös mártással",
    "subtitle": "Szaftos pörköltből készült húsos töltelékkel göngyölt sós palacsinták, cseréptálban összesütve, friss kaporral.",
    "category": "Egytálételek",
    "author": "Apa hétvégi kedvence",
    "prepTimeMinutes": 40,
    "cookTimeMinutes": 35,
    "servings": 4,
    "difficulty": "Közepes",
    "ovenTempCelsius": 190,
    "imageUrl": "/src/assets/images/hortobagyi_palacsinta_1793515502118.jpg",
    "isFavorite": False,
    "familyTip": "A töltelék akkor a legfinomabb, ha a pörkölt húsát nem daráljuk teljesen pépesre, hanem éles késsel apróra vágjuk, és 2-3 evőkanál tejfölös szafttal tesszük krémessé.",
    "createdAt": "2026-10-11",
    "ingredients": [
      { "id": "h-1", "amount": 500, "unit": "g", "name": "sertéscomb vagy csirkecomb filé", "note": "pörköltnek megfőzve" },
      { "id": "h-2", "amount": 8, "unit": "db", "name": "sós házi palacsinta", "note": "cukor nélkül sütve" },
      { "id": "h-3", "amount": 250, "unit": "ml", "name": "sűrű pörköltszaft" },
      { "id": "h-4", "amount": 200, "unit": "g", "name": "20%-os tejföl" },
      { "id": "h-5", "amount": 1, "unit": "ek", "name": "finomliszt" },
      { "id": "h-6", "amount": 1, "unit": "csokor", "name": "friss kapor és petrezselyem" }
    ],
    "steps": [
      "Az előre elkészített pörköltből kivesszük a húst, a szaftot pedig félretesszük és leszűrjük.",
      "A tejfölt simára keverjük a liszttel, hozzáadjuk a leszűrt pörköltszafthoz, és 2–3 perc alatt sűrű, bársonyos paprikás mártássá forraljuk.",
      "Az aprított pörkölthúshoz hozzáadunk 3–4 evőkanálnyit a tejfölös-paprikás mártásból, hogy szaftos, jól kenhető tölteléket kapjunk.",
      "A sós palacsinták közepére halmozzuk a húsos tölteléket, két oldalukat behajtjuk, majd szorosan feltekerjük és kivajazott cseréptálba sorakoztatjuk őket.",
      "A palacsinták tetejét bőségesen nyakon öntjük a maradék paprikás-tejfölös mártással, és 190 °C-ra előmelegített sütőben 12–15 perc alatt pirosra sütjük.",
      "Tálaláskor egy kanál friss tejföllel és finomra vágott kaporral díszítjük."
    ]
  },
  {
    "id": "unnepi-somloi-galuska",
    "title": "Ünnepi somlói galuska rumos-diós csokoládéöntettel",
    "subtitle": "Háromféle piskóta, főzött vaníliakrém, rumos mazsola, pörkölt dió és sűrű étcsokoládé-öntet tejszínhabkoronával.",
    "category": "Desszertek",
    "author": "Eszter keresztanya",
    "prepTimeMinutes": 50,
    "cookTimeMinutes": 25,
    "servings": 8,
    "difficulty": "Hagyományos",
    "ovenTempCelsius": 175,
    "imageUrl": "/src/assets/images/somloi_galuska_kehely_1793515501320.jpg",
    "isFavorite": True,
    "familyTip": "A somlóit mindig a tálalás előtti este állítsuk össze a tálban, hogy a háromféle piskóta tökéletesen magába szívja a narancshéjas-rumos szirupot és a vaníliakrémet.",
    "createdAt": "2026-10-19",
    "ingredients": [
      { "id": "s-1", "amount": 6, "unit": "db", "name": "tojás", "note": "a háromféle piskótához" },
      { "id": "s-2", "amount": 120, "unit": "g", "name": "finomliszt és 120 g kristálycukor" },
      { "id": "s-3", "amount": 150, "unit": "g", "name": "pirított darált és durvára vágott dió" },
      { "id": "s-4", "amount": 500, "unit": "ml", "name": "teljes tej", "note": "a vaníliakrémhez" },
      { "id": "s-5", "amount": 4, "unit": "db", "name": "tojássárgája és 1 rúd vanília" },
      { "id": "s-6", "amount": 150, "unit": "g", "name": "70%-os étcsokoládé", "note": "a csokoládéöntethez" },
      { "id": "s-7", "amount": 50, "unit": "ml", "name": "sötét rum és narancshéj", "note": "a sziruphoz" },
      { "id": "s-8", "amount": 300, "unit": "ml", "name": "habtejszín", "note": "frissen felverve" }
    ],
    "steps": [
      "A tojásokból, cukorból és lisztből klasszikus piskótamasszát készítünk, három részre osztjuk (sima, kakaós, diós), majd 175 °C-on 15 perc alatt megsütjük őket.",
      "A sziruphoz 2 dl vizet 100 g cukorral és narancshéjjal összeforralunk, lehűtjük, majd hozzákeverjük a rumot és beáztatjuk a mazsolát.",
      "A tejjel, tojássárgájával, vaníliával és kevés keményítővel sűrű főzött vaníliakrémet készítünk.",
      "Egy mély üvegtál aljára fektetjük az első piskótalapot, meglocsoljuk a rumos sziruppal, megkenjük vaníliakrémmel, megszórjuk dióval és mazsolával, majd rétegezzük a többi lapot is.",
      "Egy éjszakán át hűtőben pihentetjük. Tálaláskor evőkanállal galuskákat szaggatunk belőle kehelybe, leöntjük meleg étcsokoládé-mártással és friss tejszínhabbal koronázzuk."
    ]
  }
]

DEFAULT_MEAL_PLAN = [
  { "day": "Hétfő", "lunchRecipeId": "nagymama-gulyaslevese", "dinnerRecipeId": None },
  { "day": "Kedd", "lunchRecipeId": "vasarnapi-csirkepaprikas-nokedlivel", "dinnerRecipeId": None },
  { "day": "Szerda", "lunchRecipeId": None, "dinnerRecipeId": "bekebeli-turogomboc" },
  { "day": "Csütörtök", "lunchRecipeId": "hortobagyi-husos-palacsinta", "dinnerRecipeId": None },
  { "day": "Péntek", "lunchRecipeId": None, "dinnerRecipeId": None },
  { "day": "Szombat", "lunchRecipeId": "nagymama-gulyaslevese", "dinnerRecipeId": "unnepi-somloi-galuska" },
  { "day": "Vasárnap", "lunchRecipeId": "vasarnapi-csirkepaprikas-nokedlivel", "dinnerRecipeId": "bekebeli-turogomboc" }
]

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(RECIPES_FILE):
        with open(RECIPES_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_RECIPES, f, ensure_ascii=False, indent=2)
    if not os.path.exists(MEAL_PLAN_FILE):
        with open(MEAL_PLAN_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_MEAL_PLAN, f, ensure_ascii=False, indent=2)

def load_recipes():
    ensure_data_dir()
    try:
        with open(RECIPES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else DEFAULT_RECIPES
    except Exception:
        return DEFAULT_RECIPES

def save_recipes(recipes):
    ensure_data_dir()
    with open(RECIPES_FILE, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

def load_meal_plan():
    ensure_data_dir()
    try:
        with open(MEAL_PLAN_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else DEFAULT_MEAL_PLAN
    except Exception:
        return DEFAULT_MEAL_PLAN

def save_meal_plan(plan):
    ensure_data_dir()
    with open(MEAL_PLAN_FILE, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)

def is_virtualenv():
    # Detects if running inside Python venv or virtualenv
    return sys.prefix != getattr(sys, "base_prefix", sys.prefix)

app = Flask(__name__, static_folder=DIST_DIR if os.path.exists(DIST_DIR) else None)
CORS(app)

@app.route("/api/server-info", methods=["GET"])
def server_info():
    recipes = load_recipes()
    target_port = int(os.environ.get("PORT", 5000))
    hostname = socket.gethostname()
    venv_active = is_virtualenv()

    return jsonify({
        "targetPort": target_port,
        "activePort": target_port,
        "storagePath": "data/recipes.json",
        "recipeCount": len(recipes),
        "lanHostname": hostname or "raspberrypi.local",
        "platform": f"{platform.system()} {platform.machine()} ({platform.release()})",
        "runtime": f"Python {sys.version.split()[0]} (Flask)",
        "venvActive": venv_active
    })

@app.route("/api/recipes", methods=["GET"])
def get_recipes():
    return jsonify(load_recipes())

@app.route("/api/recipes", methods=["POST"])
def create_recipe():
    data = request.get_json(force=True, silent=True) or {}
    title = data.get("title", "").strip()
    category = data.get("category", "").strip()
    if not title or not category:
        return jsonify({"error": "A recept címe és kategóriája kötelező."}), 400

    recipes = load_recipes()
    recipe_id = data.get("id")
    if not recipe_id:
        safe_title = "".join(c if c.isalnum() else "-" for c in title.lower())
        recipe_id = f"{safe_title[:30]}-{int(datetime.now().timestamp())}"

    new_recipe = {
        "id": recipe_id,
        "title": title,
        "subtitle": (data.get("subtitle") or "").strip(),
        "category": category,
        "author": (data.get("author") or "Családi recept").strip(),
        "prepTimeMinutes": int(data.get("prepTimeMinutes") or 20),
        "cookTimeMinutes": int(data.get("cookTimeMinutes") or 30),
        "servings": int(data.get("servings") or 4),
        "difficulty": data.get("difficulty") or "Közepes",
        "ovenTempCelsius": int(data["ovenTempCelsius"]) if data.get("ovenTempCelsius") else None,
        "imageUrl": data.get("imageUrl") or "/src/assets/images/gulyas_leves_hero_1793515497417.jpg",
        "isFavorite": bool(data.get("isFavorite", False)),
        "familyTip": (data.get("familyTip") or "").strip(),
        "ingredients": data.get("ingredients") if isinstance(data.get("ingredients"), list) else [],
        "steps": [s.strip() for s in data.get("steps", []) if s and str(s).strip()],
        "createdAt": data.get("createdAt") or datetime.now().strftime("%Y-%m-%d")
    }

    recipes.insert(0, new_recipe)
    save_recipes(recipes)
    return jsonify(new_recipe), 201

@app.route("/api/recipes/<recipe_id>", methods=["PUT"])
def update_recipe(recipe_id):
    data = request.get_json(force=True, silent=True) or {}
    recipes = load_recipes()
    for i, r in enumerate(recipes):
        if r["id"] == recipe_id:
            updated = {**r, **data, "id": recipe_id}
            recipes[i] = updated
            save_recipes(recipes)
            return jsonify(updated)
    return jsonify({"error": "A recept nem található."}), 404

@app.route("/api/recipes/<recipe_id>/favorite", methods=["PATCH"])
def toggle_favorite(recipe_id):
    recipes = load_recipes()
    for i, r in enumerate(recipes):
        if r["id"] == recipe_id:
            recipes[i]["isFavorite"] = not recipes[i].get("isFavorite", False)
            save_recipes(recipes)
            return jsonify(recipes[i])
    return jsonify({"error": "A recept nem található."}), 404

@app.route("/api/recipes/<recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    recipes = load_recipes()
    filtered = [r for r in recipes if r["id"] != recipe_id]
    save_recipes(filtered)
    return jsonify({"success": True})

@app.route("/api/recipes/import", methods=["POST"])
def import_recipes():
    data = request.get_json(force=True, silent=True) or {}
    incoming = data.get("recipes")
    if not isinstance(incoming, list) or len(incoming) == 0:
        return jsonify({"error": "Érvénytelen receptlista."}), 400
    save_recipes(incoming)
    return jsonify({"success": True, "count": len(incoming), "recipes": incoming})

@app.route("/api/meal-plan", methods=["GET"])
def get_meal_plan():
    return jsonify(load_meal_plan())

@app.route("/api/meal-plan", methods=["PUT"])
def update_meal_plan():
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, list):
        return jsonify({"error": "Érvénytelen menüterv."}), 400
    save_meal_plan(data)
    return jsonify(data)

# Static assets routes
@app.route("/src/assets/images/<path:filename>")
def serve_image(filename):
    if os.path.exists(IMAGES_DIR):
        return send_from_directory(IMAGES_DIR, filename)
    return "Image not found", 404

# Serve frontend build in production
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, path)
        if path and os.path.exists(file_path):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")
    return "Frontend nincs lefordítva. Futtasd: npm run build", 200

if __name__ == "__main__":
    ensure_data_dir()
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    venv_status = "AKTIV (venv)" if is_virtualenv() else "NINCS VENV (Rendszer Python)"
    print("=" * 60)
    print("  Kamra & Fakanál — Családi Recepttár Python Webszerver")
    print(f"  Környezet: {venv_status}")
    print(f"  Elérési cím: http://{host}:{port}")
    print(f"  Adatbázis: {RECIPES_FILE}")
    print("=" * 60)
    app.run(host=host, port=port, debug=False)
