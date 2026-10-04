"""Zet de met de hand gekozen foto's (photo_picks.txt) om in echte afbeeldingen.

photo_picks.txt:  <dier-id>: i, j, k   (indexen uit de contactvellen van candidates.py; eerste = hoofdfoto)
Schrijft images/<id>.webp (+ -2, -3), verwijdert de oude thumbnail en legt de keuzes
vast in photo_picks.json, zodat scrape.py/extras.py ze bij een nieuwe run gebruikt.
"""
import json
import os
import shutil

from PIL import Image, ImageFilter

from media import load_raw
from scrape import CACHE, ROOT

HERE = os.path.dirname(os.path.abspath(__file__))
CAND_DIR = os.path.join(CACHE, "cand")
KEEP_DIR = os.path.join(CACHE, "keep")
os.makedirs(KEEP_DIR, exist_ok=True)
PICKS_JSON = os.path.join(HERE, "photo_picks.json")


def read_picks():
    picks = {}
    with open(os.path.join(HERE, "photo_picks.txt"), encoding="utf-8") as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if not line:
                continue
            aid, idx = line.split(":", 1)
            picks[aid.strip()] = [int(x) for x in idx.replace(" ", "").split(",") if x]
    return picks


def save(img, rel, side, quality):
    img = img.convert("RGB")
    img.thumbnail((side, side), Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=50, threshold=2))
    img.save(os.path.join(ROOT, rel), "WEBP", quality=quality, method=4)


def source_image(aid, c):
    if c.get("current"):
        # de oorspronkelijke hoofdfoto: eerst veiligstellen, want images/<id>.webp wordt overschreven
        return Image.open(os.path.join(KEEP_DIR, aid + ".webp"))
    try:
        return load_raw(f"{aid}_p{c['id']}", c["original"])
    except Exception:
        return load_raw(f"{aid}_p{c['id']}", c["original"].replace("/original.", "/large."))


def credit(c):
    if c.get("current"):
        return c["credit"]
    return {"by": c["by"] or "onbekend", "license": c["license"], "url": c["page"], "source": "iNaturalist"}


def main():
    picks = read_picks()
    done = {}
    if os.path.exists(PICKS_JSON):
        with open(PICKS_JSON, encoding="utf-8") as f:
            done = json.load(f)
    # oorspronkelijke hoofdfoto's veiligstellen vóór er iets overschreven wordt
    for aid in picks:
        keep = os.path.join(KEEP_DIR, aid + ".webp")
        if not os.path.exists(keep) and aid not in done:
            shutil.copy(os.path.join(ROOT, "images", aid + ".webp"), keep)

    for aid, idx in picks.items():
        with open(os.path.join(CAND_DIR, aid + ".json"), encoding="utf-8") as f:
            cands = json.load(f)
        chosen = [cands[i] for i in idx]
        key = [c.get("key") for c in chosen]
        if done.get(aid, {}).get("keys") == key:
            continue  # al toegepast
        photos = []
        for n, c in enumerate(chosen):
            rel = f"images/{aid}.webp" if n == 0 else f"images/{aid}-{n + 1}.webp"
            save(source_image(aid, c), rel, 1400 if n == 0 else 1100, 82 if n == 0 else 78)
            photos.append({"img": rel, "credit": credit(c)})
        for k in range(len(photos) + 1, 6):
            stale = os.path.join(ROOT, "images", f"{aid}-{k}.webp")
            if os.path.exists(stale):
                os.remove(stale)
        thumb = os.path.join(ROOT, "thumbs", aid + ".webp")
        if os.path.exists(thumb):
            os.remove(thumb)
        done[aid] = {"keys": key, "photos": photos}
        print(f"{aid}: {len(photos)} foto's", flush=True)

    with open(PICKS_JSON, "w", encoding="utf-8") as f:
        json.dump(done, f, ensure_ascii=False, indent=1)
    print(f"Klaar: {len(done)} dieren met gekozen foto's")


if __name__ == "__main__":
    main()
