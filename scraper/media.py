"""Foto's (Wikimedia Commons + iNaturalist) en verspreidingskaarten (GBIF)."""
import io
import json
import math
import os
import re
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

from PIL import Image, ImageFilter, ImageStat

from scrape import CACHE, ROOT, cache_path, cached_json, http_get

COMMONS_LOCK = threading.Lock()
INAT_LOCK = threading.Lock()  # iNaturalist-API: één verzoek tegelijk

RAW = os.path.join(CACHE, "raw")
IMG_DIR = os.path.join(ROOT, "images")
MAP_DIR = os.path.join(ROOT, "maps")
for d in (RAW, IMG_DIR, MAP_DIR):
    os.makedirs(d, exist_ok=True)

MAX_SIDE = 1400
# Commons-bestanden die waarschijnlijk geen levend dier tonen
NOT_ALIVE = re.compile(r"YPM|specimen|museum|skelet|skull|schedel|drawing|illustrat|plate|"
                       r"\bmap\b|range|distribution|dried|preserved|fossil|stamp|\.svg$", re.I)


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


# ---------- Commons ----------
def commons_info(filenames):
    """imageinfo (afmetingen, thumbnail-URL, maker, licentie) in batches van 50."""
    out, todo = {}, []
    for f in filenames:
        path = os.path.join(CACHE, "ci_" + re.sub(r"[^\w.-]+", "_", f) + ".json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as fh:
                out[f] = json.load(fh)
        else:
            todo.append(f)
    for i in range(0, len(todo), 50):
        batch = todo[i:i + 50]
        params = {
            "action": "query", "format": "json", "formatversion": "2",
            "titles": "|".join("File:" + f for f in batch), "prop": "imageinfo",
            "iiprop": "size|url|extmetadata", "iiurlwidth": "1600",
            "iiextmetadatafilter": "Artist|LicenseShortName",
        }
        q = json.loads(http_get("https://commons.wikimedia.org/w/api.php?" +
                                urllib.parse.urlencode(params)))["query"]
        norm = {n["to"]: n["from"] for n in q.get("normalized", [])}
        for p in q["pages"]:
            if "imageinfo" not in p:
                continue
            ii = p["imageinfo"][0]
            meta = ii.get("extmetadata", {})
            requested = norm.get(p["title"], p["title"])[5:]
            info = {
                "w": ii["width"], "h": ii["height"],
                "url": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"],
                "by": strip_html(meta.get("Artist", {}).get("value")),
                "license": meta.get("LicenseShortName", {}).get("value", ""),
            }
            out[requested] = info
            path = os.path.join(CACHE, "ci_" + re.sub(r"[^\w.-]+", "_", requested) + ".json")
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(info, fh, ensure_ascii=False)
        print(f"Commons-info: {min(i + 50, len(todo))}/{len(todo)}")
        time.sleep(1)
    return out


# ---------- iNaturalist ----------
def _inat_entry(p):
    return {
        "id": p["id"], "license": p.get("license_code"),
        # open gelicenseerde foto's staan in volle resolutie in de open-data-bucket
        "url": p["medium_url"].replace("/medium.", "/original." if p.get("license_code") else "/large."),
        "by": re.sub(r"^\(c\)\s*|,.*$", "", p.get("attribution", "")).strip(),
    }


def inat_photo(sci):
    def fetch():
        time.sleep(1.0)  # iNaturalist vraagt max ~1 verzoek per seconde
        url = "https://api.inaturalist.org/v1/taxa?" + urllib.parse.urlencode(
            {"q": sci, "per_page": 10, "is_active": "true"})
        for t in json.loads(http_get(url))["results"]:
            names = {t["name"].lower(), (t.get("matched_term") or "").lower()}
            if sci.lower() not in names or not t.get("default_photo"):
                continue
            if t["default_photo"].get("license_code"):
                return _inat_entry(t["default_photo"])
            # standaardfoto zonder open licentie: zoek in de overige foto's van de soort
            time.sleep(1.0)
            full = json.loads(http_get(f"https://api.inaturalist.org/v1/taxa/{t['id']}"))["results"][0]
            for tp in full.get("taxon_photos", []):
                if tp["photo"].get("license_code"):
                    return _inat_entry(tp["photo"])
            return None
        return None
    return cached_json("inat2_" + sci, fetch)


def inat_alternatives(sci):
    """Alle open gelicenseerde, liggende foto's van de soort, grootste eerst."""
    def fetch():
        time.sleep(1.0)
        url = "https://api.inaturalist.org/v1/taxa?" + urllib.parse.urlencode({"q": sci, "per_page": 10})
        for t in json.loads(http_get(url))["results"]:
            if sci.lower() in {t["name"].lower(), (t.get("matched_term") or "").lower()}:
                time.sleep(1.0)
                full = json.loads(http_get(f"https://api.inaturalist.org/v1/taxa/{t['id']}"))["results"][0]
                out = []
                for tp in full.get("taxon_photos", []):
                    p = tp["photo"]
                    dims = p.get("original_dimensions") or {}
                    w, h = dims.get("width", 0), dims.get("height", 0)
                    if p.get("license_code") and w >= h:
                        out.append(dict(_inat_entry(p), w=w))
                return sorted(out, key=lambda e: -e["w"])
        return []
    return cached_json("inatalt_" + sci, fetch)


# ---------- Beoordelen en opslaan ----------
def load_raw(key, url, max_wait=None):
    path = os.path.join(RAW, key + ".jpg")
    if not os.path.exists(path):
        data, _ = http_get(url, binary=True, max_wait=max_wait)
        img = Image.open(io.BytesIO(data)).convert("RGB")
        img.thumbnail((1600, 1600), Image.LANCZOS)
        img.save(path, "JPEG", quality=92)
        time.sleep(0.5)
    return Image.open(path)


def sharpness(img):
    small = img.convert("L")
    small.thumbnail((640, 640))
    return ImageStat.Stat(small.filter(ImageFilter.FIND_EDGES)).var[0]


def choose_photo(animal, commons, inat):
    """Kies de beste kandidaat. -> (PIL.Image, credit-dict) of (None, None)."""
    cands = []
    if inat and inat["license"]:  # alleen foto's met een open licentie
        try:
            img = load_raw(animal["id"] + "_i", inat["url"])
            cands.append((1.0, img, {
                "by": inat["by"], "license": inat["license"].upper(),
                "url": f"https://www.inaturalist.org/photos/{inat['id']}", "source": "iNaturalist"}))
            w, h = img.size
            if max(w, h) >= 1200 and w >= h:  # scherpe liggende foto van een levend dier: klaar
                return img, cands[0][2]
        except Exception as e:
            print(f"  inat-foto mislukt {animal['id']}: {e}")
    if commons:
        try:
            # 1280px is een standaardmaat die Wikimedia vooraf genereert (minder throttling)
            url = commons["url"].replace("/1600px-", "/1280px-")
            with COMMONS_LOCK:  # Commons streng beperkt: één download tegelijk
                img = load_raw(animal["id"] + "_c", url, max_wait=90)
            alive = 0.4 if NOT_ALIVE.search(animal.get("imgFile") or "") else 1.0
            cands.append((0.85 * alive, img, {
                "by": commons["by"] or "onbekend", "license": commons["license"],
                "url": commons["page"], "source": "Wikimedia Commons"}))
        except Exception as e:
            print(f"  commons-foto overgeslagen {animal['id']}: {e}")
    if not cands and commons:  # noodoplossing: eerder gedownloade 500px-versie
        for ext in (".jpg", ".png"):
            old = os.path.join(IMG_DIR, animal["id"] + ext)
            if os.path.exists(old):
                return Image.open(old), {"by": commons["by"] or "onbekend", "license": commons["license"],
                                         "url": commons["page"], "source": "Wikimedia Commons", "lowres": True}
    if not cands:
        return None, None
    sharp = [sharpness(c[1]) for c in cands]
    best, best_score = None, -1
    for (base, img, credit), s in zip(cands, sharp):
        w, h = img.size
        res = min(max(w, h), 1400) / 1400
        portrait = 0.75 if h > w * 1.15 else 1.0
        score = base * (0.4 + 0.6 * res) * (0.6 + 0.4 * s / max(sharp)) * portrait
        if score > best_score:
            best, best_score = (img, credit), score
    return best


def save_photo(img, animal_id):
    img = img.convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55, threshold=2))
    rel = f"images/{animal_id}.webp"
    img.save(os.path.join(ROOT, rel), "WEBP", quality=82, method=4)
    return rel, img.size


# ---------- GBIF-kaarten ----------
def merc_y(lat):
    return (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2


MAP_TOP, MAP_BOTTOM = merc_y(82), merc_y(-62)   # polen grotendeels wegsnijden
MAP_COLOR = (255, 94, 58)                         # koraalrood


def crop_map(img):
    w, h = img.size
    return img.crop((0, round(MAP_TOP * h), w, round(MAP_BOTTOM * h)))


def gbif_key(sci):
    def fetch():
        url = "https://api.gbif.org/v1/species/match?" + urllib.parse.urlencode(
            {"name": sci, "kingdom": "Animalia"})
        m = json.loads(http_get(url))
        if m.get("matchType") in (None, "NONE") or "usageKey" not in m:
            return None
        key = m.get("acceptedUsageKey") or m["usageKey"]
        cnt = json.loads(http_get(f"https://api.gbif.org/v1/occurrence/search?taxonKey={key}&limit=0"))
        return {"key": key, "count": cnt.get("count", 0)}
    return cached_json("gbif_" + sci, fetch)


def gbif_map(animal_id, key):
    rel = f"maps/{animal_id}.webp"
    out = os.path.join(ROOT, rel)
    if os.path.exists(out):
        return rel
    url = (f"https://api.gbif.org/v2/map/occurrence/density/0/0/0@2x.png?taxonKey={key}"
           "&bin=hex&hexPerTile=90&style=classic-noborder.poly&srs=EPSG:3857")
    try:
        data, _ = http_get(url, binary=True)
    except Exception as e:
        print(f"  kaart mislukt {animal_id}: {e}")
        return None
    tile = crop_map(Image.open(io.BytesIO(data)).convert("RGBA"))
    # dichtheid zit in de kleur (geel -> rood); omzetten naar Ã©Ã©n kleur met variabele dekking
    r, g, b, a = tile.split()
    strength = g.point(lambda v: 150 + (255 - v) * 105 // 255)
    alpha = Image.composite(strength, Image.new("L", tile.size, 0), a.point(lambda v: 255 if v > 20 else 0))
    solid = Image.new("RGBA", tile.size, MAP_COLOR + (0,))
    solid.putalpha(alpha)
    if not solid.getbbox():
        return None
    solid.thumbnail((760, 760), Image.LANCZOS)
    solid.save(out, "WEBP", quality=78)
    return rel


def base_maps():
    """Wereldkaart (land/zee) in twee kleurenschema's, zelfde uitsnede als de dierkaarten."""
    data, _ = http_get("https://tile.gbif.org/3857/omt/0/0/0@2x.png?style=gbif-light", binary=True)
    base = crop_map(Image.open(io.BytesIO(data)).convert("L"))
    land = base.point(lambda v: 255 if v > 220 else 0)  # land is lichter dan zee
    for name, sea, ground in (("light", (214, 230, 241), (248, 250, 252)),
                              ("dark", (14, 31, 48), (38, 55, 72))):
        img = Image.composite(Image.new("RGB", base.size, ground), Image.new("RGB", base.size, sea), land)
        img.thumbnail((900, 900), Image.LANCZOS)
        img.save(os.path.join(MAP_DIR, f"_base-{name}.png"), optimize=True)


def enrich(animals):
    """Voegt img, imgSize, credit, map, obs toe; laat dieren zonder foto vallen."""
    infos = commons_info([a["imgFile"] for a in animals if a.get("imgFile")])
    base_maps()

    # Fase 1: iNaturalist-API, achter elkaar (max ~1 verzoek per seconde)
    inat = {}
    for i, a in enumerate(animals):
        inat[a["id"]] = inat_photo(a["sci"])
        if i % 50 == 0:
            print(f"iNaturalist: {i}/{len(animals)}")

    # Fase 2: foto's kiezen/opslaan en kaarten maken, parallel
    def work(a):
        done = cache_path(f"photo_{a['id']}")
        if os.path.exists(done) and os.path.exists(os.path.join(ROOT, f"images/{a['id']}.webp")):
            with open(done, encoding="utf-8") as f:
                a.update(json.load(f))
        else:
            img, credit = choose_photo(a, infos.get(a.get("imgFile")), inat[a["id"]])
            if img is None or max(img.size) < 1000:
                # te klein: probeer de grootste andere iNaturalist-foto van deze soort
                with INAT_LOCK:
                    alts = inat_alternatives(a["sci"])
                if alts and alts[0]["w"] >= 1000:
                    try:
                        alt = load_raw(a["id"] + f"_a{alts[0]['id']}", alts[0]["url"])
                        img, credit = alt, {
                            "by": alts[0]["by"], "license": alts[0]["license"].upper(),
                            "url": f"https://www.inaturalist.org/photos/{alts[0]['id']}", "source": "iNaturalist"}
                    except Exception as e:
                        print(f"  alternatief mislukt {a['id']}: {e}")
            if img is None:
                print(f"  geen foto: {a['name']}")
                return None
            a["img"], a["imgSize"] = save_photo(img, a["id"])
            a["credit"] = credit
            if not credit.get("lowres"):  # lage resolutie: volgende run opnieuw proberen
                with open(done, "w", encoding="utf-8") as f:
                    json.dump({k: a[k] for k in ("img", "imgSize", "credit")}, f, ensure_ascii=False)
        g = gbif_key(a["sci"])
        a["obs"] = g["count"] if g else 0
        a["map"] = gbif_map(a["id"], g["key"]) if g and g["count"] else None
        return a

    keep, done_count = [], 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        for a in ex.map(work, animals):
            done_count += 1
            if a:
                keep.append(a)
            if done_count % 25 == 0:
                print(f"Media: {done_count}/{len(animals)}")
    return keep
