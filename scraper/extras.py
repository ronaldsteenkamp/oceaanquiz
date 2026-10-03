"""Extra's bovenop media.py:
- meerdere foto's per dier (iNaturalist), met voorkeur voor licenties zonder NC
- kleine thumbnails voor de gids
- stamboom (orde/familie) via GBIF, voor slimmere foute antwoorden
- Noordzee-waarnemingen via GBIF
"""
import json
import os
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

from PIL import Image, ImageFilter

from media import INAT_LOCK, inat_alternatives, load_raw
from scrape import ROOT, cached_json, http_get

THUMB_DIR = os.path.join(ROOT, "thumbs")
os.makedirs(THUMB_DIR, exist_ok=True)

EXTRA_PHOTOS = 2        # naast de hoofdfoto
EXTRA_SIDE = 1100
THUMB_SIDE = 420
NORTH_SEA_MIN = 10      # zoveel waarnemingen in de Noordzee = "komt voor in de Noordzee"
NS_LOCK = threading.Lock()

# Ruwe omtrek van de Noordzee (tegen de klok in, zoals GBIF vereist)
NORTH_SEA = ("POLYGON((1.5 51.0,3.0 51.3,4.4 52.1,4.7 53.0,6.0 53.6,8.5 53.9,8.3 55.0,8.0 56.6,"
             "8.6 57.2,7.0 58.0,5.0 58.8,4.8 61.0,-1.0 61.0,-1.6 59.0,-2.0 57.5,-1.8 55.6,"
             "-0.5 54.5,0.2 53.4,1.7 52.6,1.5 51.0))")


def is_nc(license_code):
    return "NC" in (license_code or "").upper()


def credit_for(alt):
    return {"by": alt["by"], "license": alt["license"].upper(),
            "url": f"https://www.inaturalist.org/photos/{alt['id']}", "source": "iNaturalist"}


def save_variant(img, rel, side, quality, sharpen=True):
    img = img.convert("RGB")
    img.thumbnail((side, side), Image.LANCZOS)
    if sharpen:
        img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=50, threshold=2))
    img.save(os.path.join(ROOT, rel), "WEBP", quality=quality, method=4)
    return list(img.size)


def make_thumb(animal_id, img_rel):
    rel = f"thumbs/{animal_id}.webp"
    if not os.path.exists(os.path.join(ROOT, rel)):
        img = Image.open(os.path.join(ROOT, img_rel)).convert("RGB")
        # vierkant-achtig bijsnijden rond het midden (tegeltjes zijn 4:3)
        w, h = img.size
        target = 4 / 3
        if w / h > target:
            nw = round(h * target)
            img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        save_variant(img, rel, THUMB_SIDE, 74)
    return rel


def photos_for(a):
    """-> lijst foto's [{img, size, credit}], hoofdfoto eerst."""
    main = {"img": a["img"], "size": a["imgSize"], "credit": a["credit"]}
    with INAT_LOCK:
        alts = inat_alternatives(a["sci"])
    main_id = a["credit"]["url"].rsplit("/", 1)[-1]
    alts = [x for x in alts if str(x["id"]) != main_id and x["w"] >= 800]
    # licenties zonder NC eerst, daarna groot naar klein
    alts.sort(key=lambda x: (is_nc(x["license"]), -x["w"]))

    photos = [main]
    # hoofdfoto met NC-licentie vervangen door een even goede foto zonder NC, als die er is
    if is_nc(a["credit"]["license"]) and alts and not is_nc(alts[0]["license"]) and alts[0]["w"] >= 1200:
        best = alts.pop(0)
        try:
            img = load_raw(a["id"] + f"_a{best['id']}", best["url"])
            size = save_variant(img, a["img"], 1400, 82)
            photos = [{"img": a["img"], "size": size, "credit": credit_for(best)}]
        except Exception as e:
            print(f"  vervangen mislukt {a['id']}: {e}")

    for alt in alts:
        if len(photos) > EXTRA_PHOTOS:
            break
        rel = f"images/{a['id']}-{len(photos) + 1}.webp"
        try:
            if os.path.exists(os.path.join(ROOT, rel)):
                with Image.open(os.path.join(ROOT, rel)) as im:
                    size = list(im.size)
            else:
                size = save_variant(load_raw(a["id"] + f"_a{alt['id']}", alt["url"]), rel, EXTRA_SIDE, 78)
            photos.append({"img": rel, "size": size, "credit": credit_for(alt)})
        except Exception as e:
            print(f"  extra foto mislukt {a['id']}: {e}")
    return photos


def taxonomy(sci):
    def fetch():
        m = json.loads(http_get("https://api.gbif.org/v1/species/match?" +
                                urllib.parse.urlencode({"name": sci, "kingdom": "Animalia"})))
        key = m.get("acceptedUsageKey") or m.get("usageKey")
        if not key:
            return {}
        s = json.loads(http_get(f"https://api.gbif.org/v1/species/{key}"))
        return {k: s.get(k) for k in ("class", "order", "family", "genus")}
    return cached_json("tax_" + sci, fetch)


NORTH_SEA_MIN_DATASETS = 3   # bevestigd door minstens zoveel onafhankelijke databronnen


def north_sea_count(key):
    """Waarnemingen in de Noordzee. Eén databron met foute coördinaten (die bv. pinguïns in de
    Noordzee zet) mag niet genoeg zijn: we tellen alleen als meerdere bronnen het dier daar zien."""
    def fetch():
        # occurrenceStatus=PRESENT: scheepstellingen (bv. Polarstern) registreren ook 'niet gezien'
        # als record; zonder dit filter staan albatrossen en pinguïns 'in de Noordzee'
        params = [("taxonKey", key), ("geometry", NORTH_SEA), ("limit", 0), ("occurrenceStatus", "PRESENT"),
                  ("basisOfRecord", "HUMAN_OBSERVATION"), ("basisOfRecord", "MACHINE_OBSERVATION"),
                  ("facet", "datasetKey"), ("facetLimit", 50)]
        r = json.loads(http_get("https://api.gbif.org/v1/occurrence/search?" + urllib.parse.urlencode(params)))
        counts = {c["name"]: c["count"] for f in r.get("facets", []) for c in f["counts"]}
        return {"count": r.get("count", 0), "datasets": counts}
    def polite_fetch():
        with NS_LOCK:  # zwaardere zoekvraag: één tegelijk, anders volgt HTTP 429
            time.sleep(0.5)
            return fetch()
    r = cached_json(f"ns3_{key}", polite_fetch)
    return r["count"] if len(r["datasets"]) >= NORTH_SEA_MIN_DATASETS else 0


def extend(animals):
    from media import gbif_key

    def work(a):
        result = {}
        result["photos"] = photos_for(a)
        a["img"], a["imgSize"], a["credit"] = (result["photos"][0][k] for k in ("img", "size", "credit"))
        result["thumb"] = make_thumb(a["id"], a["img"])
        tax = taxonomy(a["sci"])
        result["order"], result["family"] = tax.get("order"), tax.get("family")
        g = gbif_key(a["sci"])
        result["ns"] = north_sea_count(g["key"]) if g else 0
        a.update(result)
        return a

    out, n = [], 0
    with ThreadPoolExecutor(max_workers=5) as ex:
        for a in ex.map(work, animals):
            out.append(a)
            n += 1
            if n % 25 == 0:
                print(f"Extra's: {n}/{len(animals)}")
    nc = sum(1 for a in out for p in a["photos"] if is_nc(p["credit"]["license"]))
    total = sum(len(a["photos"]) for a in out)
    print(f"Foto's: {total} ({nc} met NC-licentie); hoofdfoto's met NC: "
          f"{sum(1 for a in out if is_nc(a['credit']['license']))}; "
          f"Noordzee: {sum(1 for a in out if a['ns'] >= NORTH_SEA_MIN)}")
    return out
