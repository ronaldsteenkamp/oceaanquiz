"""Zoekt op Wikimedia Commons naar extra foto's voor dieren zonder goede foto van een levend exemplaar.

Resultaat: cache/commons/<id>.json (kandidaten) + cache/commons/sheet_XX.jpg (contactvellen, 2 dieren per vel).
Kies daarna met de hand in commons_picks.txt (id: index, index ...).
"""
import io
import json
import os
import re
import sys
import time
import urllib.parse

from PIL import Image, ImageDraw

from candidates import COLS, TILE_H, TILE_W, font
from scrape import CACHE, ROOT, http_get

OUT = os.path.join(CACHE, "commons")
os.makedirs(OUT, exist_ok=True)
API = "https://commons.wikimedia.org/w/api.php?"
OK_LICENSE = re.compile(r"^(cc0|cc[- ]by(-sa)?[- ]?[\d.]*|public domain|pd)", re.I)
MAX = 16

IDS = """neophocaena-phocaenoides pontoporia-blainvillei trichechus-senegalensis lamna-nasus mitsukurina-owstoni
isistius-brasiliensis megachasma-pelagios dipturus-batis macrocheira-kaempferi sarda-sarda acipenser-sturio
eurypharynx-pelecanoides thunnus-obesus hippoglossoides-platessoides scomber-scombrus sebastes-norvegicus
histrio-histrio liparis-liparis chauliodus-sloani sprattus-sprattus exocoetus-volitans anoplogaster-cornuta
thunnus-alalunga ensis-leei architeuthis-dux todarodes-sagittatus cerastoderma-edule mesonychoteuthis-hamiltoni
macoma-balthica mya-arenaria engraulis-encrasicolus sardina-pilchardus clupea-harengus caranx-hippos alle-alle
pristiophorus-cirratus mustelus-asterias merlangius-merlangus""".split()


def api(params):
    params.update(format="json", formatversion="2")
    for attempt in range(4):
        try:
            return json.loads(http_get(API + urllib.parse.urlencode(params), max_wait=60))
        except Exception as e:
            print("  opnieuw:", e, flush=True)
            time.sleep(5 * (attempt + 1))
    return {}


def search(sci):
    res = api({"action": "query", "generator": "search", "gsrnamespace": 6, "gsrlimit": 40,
               "gsrsearch": f'"{sci}" filetype:bitmap', "prop": "imageinfo",
               "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 480})
    out = []
    for p in res.get("query", {}).get("pages", []):
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = re.sub("<[^>]+>", "", meta.get("LicenseShortName", {}).get("value", "")).strip()
        by = re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()[:80]
        w, h = ii.get("width", 0), ii.get("height", 0)
        if not OK_LICENSE.match(lic) or w < 900 or ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        out.append({"title": p["title"], "thumb": ii.get("thumburl"), "url": ii.get("url"), "w": w, "h": h,
                    "license": lic.upper().replace(" ", "-"), "by": by or "onbekend",
                    "page": ii.get("descriptionurl")})
    out.sort(key=lambda c: -(c["w"] * c["h"]))
    return out[:MAX]


def main():
    s = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    animals = {a["id"]: a for a in json.loads(s[s.index("=") + 1:s.index("window.OCEAN_META")].rstrip().rstrip(";"))}
    f_big, f_small = font(26), font(15)
    for n in range(0, len(IDS), 2):
        pair = IDS[n:n + 2]
        rows_per = 4
        block_h = 36 + rows_per * TILE_H
        sheet = Image.new("RGB", (COLS * TILE_W, block_h * len(pair)), "white")
        d = ImageDraw.Draw(sheet)
        for b, aid in enumerate(pair):
            a = animals[aid]
            path = os.path.join(OUT, aid + ".json")
            cands = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else search(a["sci"])
            json.dump(cands, open(path, "w", encoding="utf-8"), ensure_ascii=False)
            y0 = b * block_h
            d.rectangle((0, y0, COLS * TILE_W, y0 + 34), fill=(20, 40, 60))
            d.text((8, y0 + 7), f"{aid}  |  {a['name']}  ({len(cands)} kandidaten)", fill="white", font=f_small)
            for i, c in enumerate(cands):
                x, y = (i % COLS) * TILE_W, y0 + 36 + (i // COLS) * TILE_H
                tile = os.path.join(OUT, f"{aid}_{i}.jpg")
                try:
                    if not os.path.exists(tile):
                        data, _ = http_get(c["thumb"], binary=True, max_wait=60)
                        Image.open(io.BytesIO(data)).convert("RGB").save(tile, "JPEG", quality=85)
                        time.sleep(0.3)
                    im = Image.open(tile)
                    im.thumbnail((TILE_W - 4, TILE_H - 4))
                    sheet.paste(im, (x + (TILE_W - im.width) // 2, y + (TILE_H - im.height) // 2))
                except Exception as e:
                    d.text((x + 10, y + 70), "laden mislukt", fill="red", font=f_small)
                d.rectangle((x + 2, y + 2, x + 34, y + 30), fill=(0, 0, 0))
                d.text((x + 8, y + 2), str(i), fill="white", font=f_big)
        sheet.save(os.path.join(OUT, f"sheet_{n // 2:02d}.jpg"), "JPEG", quality=80)
        print(f"vel {n // 2}: {', '.join(pair)}", flush=True)


if __name__ == "__main__":
    main()
