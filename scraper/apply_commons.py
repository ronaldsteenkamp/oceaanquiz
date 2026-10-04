"""Zet de Commons-keuzes (commons_picks.txt, kandidaten uit commons_search.py) om in afbeeldingen.

Schrijft images/<id>.webp (+ -2, -3), verwijdert verouderde extra foto's en de thumbnail,
en legt de keuzes vast in commons_picks.json (gaat in extras.py vóór photo_picks.json).
"""
import io
import json
import os
import re
import time

from PIL import Image

from apply_picks import save
from scrape import CACHE, ROOT, http_get

HERE = os.path.dirname(os.path.abspath(__file__))
CAND_DIR = os.path.join(CACHE, "commons")
OUT_JSON = os.path.join(HERE, "commons_picks.json")


def read_picks():
    picks = {}
    for line in open(os.path.join(HERE, "commons_picks.txt"), encoding="utf-8"):
        line = line.split("#", 1)[0].strip()
        if line:
            aid, idx = line.split(":", 1)
            picks[aid.strip()] = [int(x) for x in idx.replace(" ", "").split(",") if x]
    return picks


def fetch(c):
    url = c["url"]
    if c["w"] > 1920 and re.search(r"/\d+px-", c["thumb"] or ""):
        url = re.sub(r"/\d+px-", "/1920px-", c["thumb"].split("?")[0])
    data, _ = http_get(url, binary=True, max_wait=90)
    time.sleep(0.5)
    return Image.open(io.BytesIO(data))


def main():
    done = json.load(open(OUT_JSON, encoding="utf-8")) if os.path.exists(OUT_JSON) else {}
    for aid, idx in read_picks().items():
        cands = json.load(open(os.path.join(CAND_DIR, aid + ".json"), encoding="utf-8"))
        chosen = [cands[i] for i in idx]
        keys = [c["title"] for c in chosen]
        if done.get(aid, {}).get("keys") == keys:
            continue
        photos = []
        for n, c in enumerate(chosen):
            rel = f"images/{aid}.webp" if n == 0 else f"images/{aid}-{n + 1}.webp"
            save(fetch(c), rel, 1400 if n == 0 else 1100, 82 if n == 0 else 78)
            photos.append({"img": rel, "credit": {"by": c["by"], "license": c["license"],
                                                  "url": c["page"], "source": "Wikimedia Commons"}})
        for n in range(len(chosen) + 1, 4):
            p = os.path.join(ROOT, "images", f"{aid}-{n}.webp")
            if os.path.exists(p):
                os.remove(p)
        thumb = os.path.join(ROOT, "thumbs", aid + ".webp")
        if os.path.exists(thumb):
            os.remove(thumb)
        done[aid] = {"keys": keys, "photos": photos}
        print(f"{aid}: {len(photos)} foto('s)", flush=True)
    json.dump(done, open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
