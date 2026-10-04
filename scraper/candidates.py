"""Verzamelt per dier kandidaat-foto's en maakt contactvellen om met de hand te kiezen.

Bronnen (alleen open licenties):
  - iNaturalist-waarnemingen van wilde dieren (research grade = nooit in gevangenschap), meest gewaardeerd eerst
  - iNaturalist-soortfoto's
  - de huidige foto('s)
Gebruik:  python candidates.py          -> cache/cand/*.json + cache/sheets/sheet_XXX.jpg
"""
import io
import json
import os
import sys
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

from PIL import Image, ImageDraw, ImageFont

from scrape import CACHE, ROOT, cached_json, http_get

CAND_DIR = os.path.join(CACHE, "cand")
SHEET_DIR = os.path.join(CACHE, "sheets")
for d in (CAND_DIR, SHEET_DIR):
    os.makedirs(d, exist_ok=True)

MAX_CANDS = 12
LICENSES = "cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd"


_RATE_LOCK = threading.Lock()
_last_call = [0.0]


def inat(url):
    # iNaturalist: max ~1 verzoek per seconde, over alle threads samen
    with _RATE_LOCK:
        wait = 1.05 - (time.time() - _last_call[0])
        if wait > 0:
            time.sleep(wait)
        _last_call[0] = time.time()
    return json.loads(http_get(url))


def photo_entry(p, origin):
    dims = p.get("original_dimensions") or {}
    return {
        "id": p["id"], "origin": origin, "license": (p.get("license_code") or "").upper(),
        "w": dims.get("width") or 0, "h": dims.get("height") or 0,
        "medium": p["url"].replace("/square.", "/medium."),
        "original": p["url"].replace("/square.", "/original."),
        "by": (p.get("attribution") or "").replace("(c) ", "").split(",")[0].strip(),
        "page": f"https://www.inaturalist.org/photos/{p['id']}",
    }


def usable(e):
    e["w"], e["h"] = e["w"] or 0, e["h"] or 0  # (oudere cache kan None bevatten)
    return e["license"] and e["w"] >= 1000 and e["w"] >= e["h"] * 1.05


def candidates_for(sci):
    def fetch():
        res = inat("https://api.inaturalist.org/v1/taxa?" + urllib.parse.urlencode({"q": sci, "per_page": 10}))
        taxon = next((t for t in res["results"]
                      if sci.lower() in {t["name"].lower(), (t.get("matched_term") or "").lower()}), None)
        if not taxon:
            return []
        out = []
        obs = inat("https://api.inaturalist.org/v1/observations?" + urllib.parse.urlencode({
            "taxon_id": taxon["id"], "quality_grade": "research", "photos": "true",
            "photo_license": LICENSES, "order_by": "votes", "per_page": 30}))
        for o in obs["results"]:
            for p in o.get("photos", [])[:2]:
                out.append(photo_entry(p, "waarneming"))
        full = inat(f"https://api.inaturalist.org/v1/taxa/{taxon['id']}")["results"][0]
        for tp in full.get("taxon_photos", []):
            out.append(photo_entry(tp["photo"], "soortfoto"))
        return out
    return cached_json("cand_" + sci, fetch)


def font(size):
    for f in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


TILE_W, TILE_H, COLS = 240, 180, 4


def tile_image(url, key):
    path = os.path.join(CAND_DIR, key + ".jpg")
    if not os.path.exists(path):
        data, _ = http_get(url, binary=True)
        img = Image.open(io.BytesIO(data)).convert("RGB")
        img.thumbnail((TILE_W * 2, TILE_H * 2))
        img.save(path, "JPEG", quality=85)
    return Image.open(path)


def _safe_tile(c):
    try:
        tile_image(c["medium"], c["key"])
    except Exception as e:
        print(f"  tegel mislukt {c['key']}: {e}", flush=True)


def make_sheet(entries, out_path):
    """entries: [(animal, [cands])] -> één contactvel."""
    f_big, f_small = font(26), font(15)
    rows_per = 3
    block_h = 36 + rows_per * TILE_H
    sheet = Image.new("RGB", (COLS * TILE_W, block_h * len(entries)), "white")
    d = ImageDraw.Draw(sheet)
    for b, (a, cands) in enumerate(entries):
        y0 = b * block_h
        d.rectangle((0, y0, COLS * TILE_W, y0 + 34), fill=(20, 40, 60))
        d.text((8, y0 + 7), f"{a['id']}  |  {a['name']}  ({a['cat']})", fill="white", font=f_small)
        for i, c in enumerate(cands):
            x, y = (i % COLS) * TILE_W, y0 + 36 + (i // COLS) * TILE_H
            try:
                im = tile_image(c["medium"] if "medium" in c else c["src"], c["key"])
                im = im.copy()
                im.thumbnail((TILE_W - 4, TILE_H - 4))
                sheet.paste(im, (x + (TILE_W - im.width) // 2, y + (TILE_H - im.height) // 2))
            except Exception as e:
                d.text((x + 10, y + 70), "laden mislukt", fill="red", font=f_small)
            d.rectangle((x + 2, y + 2, x + 34, y + 30), fill=(255, 210, 0) if c.get("current") else (0, 0, 0))
            d.text((x + 8, y + 2), str(i), fill="black" if c.get("current") else "white", font=f_big)
    sheet.save(out_path, "JPEG", quality=80)


def main():
    s = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    animals = json.loads(s[s.index("=") + 1:s.index("window.OCEAN_META")].rstrip().rstrip(";"))
    order = {"Zoogdieren": 0, "Reptielen": 1, "Haaien & roggen": 2, "Zeevogels": 3}
    animals.sort(key=lambda a: (order.get(a["cat"], 9), a["cat"], a["name"]))
    # eerst alle kandidaatlijsten ophalen (parallel, binnen de snelheidslimiet)
    with ThreadPoolExecutor(max_workers=4) as ex:
        for i, _ in enumerate(ex.map(lambda a: candidates_for(a["sci"]), animals)):
            if i % 25 == 0:
                print(f"iNaturalist: {i}/{len(animals)}", flush=True)
    pending = []
    sheet_no = 0
    for n, a in enumerate(animals):
        cands, seen = [], set()
        # 0 = huidige hoofdfoto (zodat 'houden' ook een keuze is)
        cur = a["photos"][0]
        cands.append({"key": f"{a['id']}_cur", "src": os.path.join(ROOT, cur["img"]), "current": True,
                      "credit": cur["credit"], "local": cur["img"]})
        cur_id = cur["credit"]["url"].rsplit("/", 1)[-1]
        seen.add(cur_id)
        for e in candidates_for(a["sci"]):
            if str(e["id"]) in seen or not usable(e):
                continue
            seen.add(str(e["id"]))
            cands.append(dict(e, key=f"{a['id']}_{e['id']}"))
            if len(cands) >= MAX_CANDS:
                break
        with open(os.path.join(CAND_DIR, a["id"] + ".json"), "w", encoding="utf-8") as f:
            json.dump(cands, f, ensure_ascii=False)
        # huidige foto als tegel
        cur_tile = os.path.join(CAND_DIR, cands[0]["key"] + ".jpg")
        if not os.path.exists(cur_tile):
            im = Image.open(cands[0]["src"]).convert("RGB")
            im.thumbnail((TILE_W * 2, TILE_H * 2))
            im.save(cur_tile, "JPEG", quality=85)
        # tegels parallel downloaden (S3 van iNaturalist is snel, maar één voor één duurt te lang)
        with ThreadPoolExecutor(max_workers=8) as ex:
            list(ex.map(lambda c: _safe_tile(c), cands[1:]))
        pending.append((a, cands))
        if len(pending) == 2 or n == len(animals) - 1:
            make_sheet(pending, os.path.join(SHEET_DIR, f"sheet_{sheet_no:03d}.jpg"))
            sheet_no += 1
            pending = []
        if n % 20 == 0:
            print(f"Kandidaten: {n}/{len(animals)}", flush=True)
    print(f"Klaar: {sheet_no} contactvellen in {SHEET_DIR}")


if __name__ == "__main__":
    main()
