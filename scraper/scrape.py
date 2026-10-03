"""Scrapet zeedieren van Wikidata + Nederlandse Wikipedia en schrijft ../data.js.
Foto's (Commons/iNaturalist) en kaarten (GBIF) komen uit media.py.

Gebruik:  python scrape.py              (alles, met cache)
          python scrape.py --no-images  (alleen teksten)
          python scrape.py --limit 10   (snel testen)
"""
import hashlib
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from species import all_species

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache")
UA = "OceaanQuizScraper/1.0 (persoonlijk leerproject; python-urllib)"

os.makedirs(CACHE, exist_ok=True)


def http_get(url, binary=False, tries=5, max_wait=None):
    """GET met nette retries. max_wait: geef op als de server langer wil dat we wachten."""
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                ctype = r.headers.get("Content-Type", "")
            return (data, ctype) if binary else data.decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            retry_after = e.headers.get("Retry-After")
            wait = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt * 5
            if max_wait is not None and wait > max_wait:
                raise RuntimeError(f"HTTP {e.code}, server vraagt {wait}s wachten") from e
            print(f"  HTTP {e.code}, opnieuw over {wait}s: {url[:90]}")
            time.sleep(wait)
        except Exception as e:  # netwerkfout
            wait = 2 ** attempt * 2
            print(f"  fout {e!r}, opnieuw over {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"Mislukt: {url}")


def http_post(url, body):
    req = urllib.request.Request(url, data=body, headers={
        "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            retry_after = e.headers.get("Retry-After")
            wait = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt * 5
            print(f"  HTTP {e.code}, opnieuw over {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"Mislukt: POST {url}")


def cache_path(key):
    return os.path.join(CACHE, re.sub(r"[^\w.-]+", "_", key) + ".json")


def cached_json(key, fetch):
    path = cache_path(key)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    data = fetch()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    return data


# ---------- 1. Wikidata ----------
SPARQL = """
SELECT ?name ?item ?nlTitle ?nlLabel ?image WHERE {
  VALUES ?name { %s }
  ?item wdt:P225 ?name .
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item rdfs:label ?nlLabel FILTER(LANG(?nlLabel) = "nl") }
  OPTIONAL { ?art schema:about ?item ; schema:isPartOf <https://nl.wikipedia.org/> ;
             schema:name ?nlTitle }
}"""


def wikidata_lookup(names):
    results = {}
    for i in range(0, len(names), 60):
        batch = names[i:i + 60]
        values = " ".join(json.dumps(n) for n in batch)

        def fetch():
            url = "https://query.wikidata.org/sparql?format=json&query=" + \
                urllib.parse.quote(SPARQL % values)
            return json.loads(http_get(url))["results"]["bindings"]

        key = hashlib.md5(values.encode()).hexdigest()[:10]
        rows = cached_json(f"wd_{key}", fetch)
        for row in rows:
            name = row["name"]["value"]
            cand = {
                "qid": row["item"]["value"].rsplit("/", 1)[-1],
                "nlTitle": row.get("nlTitle", {}).get("value"),
                "nlLabel": row.get("nlLabel", {}).get("value"),
                "image": row.get("image", {}).get("value"),
            }
            prev = results.get(name)
            # voorkeur: item met NL-artikel, daarna met foto
            score = (cand["nlTitle"] is not None) * 2 + (cand["image"] is not None)
            if prev is None or score > prev[0]:
                results[name] = (score, cand)
        print(f"Wikidata: {min(i + 60, len(names))}/{len(names)}")
    return {k: v[1] for k, v in results.items()}


# ---------- 2. Nederlandse Wikipedia ----------
NS_PREFIX = re.compile(r"^\s*:?(Bestand|File|Afbeelding|Image|Categorie|Category|Media|[a-z]{2,3}):", re.I)


def wikitext_to_plain(wt):
    """Ruwe omzetting van wikitekst naar platte tekst (zelfde vorm als TextExtracts)."""
    wt = re.sub(r"<!--.*?-->", "", wt, flags=re.S)
    wt = re.sub(r"<ref[^>]*/>", "", wt)
    wt = re.sub(r"<ref[^>]*>.*?</ref>", "", wt, flags=re.S)
    wt = re.sub(r"<(gallery|math|timeline|syntaxhighlight)[^>]*>.*?</\1>", "", wt, flags=re.S | re.I)
    prev = None
    while prev != wt:  # sjablonen en tabellen van binnen naar buiten weghalen
        prev = wt
        wt = re.sub(r"\{\{[^{}]*\}\}", "", wt)
        wt = re.sub(r"\{\|(?:(?!\{\|).)*?\|\}", "", wt, flags=re.S)

    def link(m):
        inner = m.group(1)
        return "" if NS_PREFIX.match(inner) else inner.split("|")[-1]
    prev = None
    while prev != wt:
        prev = wt
        wt = re.sub(r"\[\[([^\[\]]*)\]\]", link, wt)
    wt = re.sub(r"\[https?://\S+\s+([^\]]*)\]", r"\1", wt)
    wt = re.sub(r"\[https?://\S+\]", "", wt)
    wt = re.sub(r"'{2,}", "", wt)
    wt = re.sub(r"<[^>]+>", "", wt)
    wt = re.sub(r"__[A-Z]+__", "", wt)
    wt = html.unescape(wt).replace(" ", " ")
    lines = []
    for line in wt.split("\n"):
        line = re.sub(r"^[*#:;]+\s*", "", line).strip()
        line = re.sub(r"\s{2,}", " ", line)
        if line and not line.startswith(("|", "!", "{", "}")):
            lines.append(line)
    return "\n".join(lines)


def nlwiki_prefetch(titles):
    """Haalt wikitekst van 50 artikelen per verzoek op en vult de cache."""
    todo = [t for t in titles if not os.path.exists(cache_path("nl_" + t))]
    for i in range(0, len(todo), 50):
        batch = todo[i:i + 50]
        params = {
            "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
            "prop": "revisions|pageimages", "rvprop": "content", "rvslots": "main",
            "piprop": "name", "titles": "|".join(batch),
        }
        url = "https://nl.wikipedia.org/w/api.php"
        data = urllib.parse.urlencode(params).encode()
        q = json.loads(http_post(url, data))["query"]
        alias = {}
        for kind in ("normalized", "redirects"):
            for r in q.get(kind, []):
                alias[r["from"]] = r["to"]
        pages = {p["title"]: p for p in q["pages"]}
        for t in batch:
            target = t
            while target in alias:
                target = alias[target]
            p = pages.get(target)
            if not p or "revisions" not in p:
                continue
            wt = p["revisions"][0]["slots"]["main"]["content"]
            entry = {"title": p["title"], "extract": wikitext_to_plain(wt),
                     "pageimage": p.get("pageimage")}
            with open(cache_path("nl_" + t), "w", encoding="utf-8") as f:
                json.dump(entry, f, ensure_ascii=False)
        print(f"Wikipedia: {min(i + 50, len(todo))}/{len(todo)} artikelen opgehaald")
        time.sleep(2)


def nlwiki_page(title):
    def fetch():
        params = {
            "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
            "prop": "extracts|pageimages", "explaintext": "1", "piprop": "name",
            "titles": title,
        }
        url = "https://nl.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)
        time.sleep(1.0)  # netjes blijven tegenover de Wikipedia-API
        page = json.loads(http_get(url))["query"]["pages"][0]
        return {"title": page.get("title"), "extract": page.get("extract", ""),
                "pageimage": page.get("pageimage")}
    return cached_json("nl_" + title, fetch)


SKIP_SECTIONS = re.compile(
    r"bron|externe link|referent|zie ook|literatuur|voetnot|noten|afbeelding|galerij|"
    r"ondersoort|synoniem|taxonomie|systematiek|etymologie|naamgeving|soorten|"
    r"fylogenie|indeling|in de kunst|cultuur|trivia", re.I)
UNITS = (r"(cm|centimeter|millimeter|mm|meter|m|km|kilometer|kg|kilo|kilogram|ton|gram|g|"
         r"jaar|jaren|dagen|maanden|uur|minuten|km/u|km/h|kilometer per uur|graden|°C|"
         r"procent|%|eieren|liter|tanden|armen|harten)")
RE_NUM = re.compile(r"\d[\d.,]*\s*" + UNITS + r"\b", re.I)
RE_SUPER = re.compile(
    r"\b(grootste|kleinste|snelste|langste|zwaarste|oudste|diepste|giftigste|enige|"
    r"zeldzaamste|meeste|record|ter wereld|op aarde|uniek|opvallend|bijzonder)\b", re.I)
RE_FUN = re.compile(
    r"\b(kan|kunnen|eet|eten|jaagt|jagen|prooi|gif|giftig|licht|lichtgevend|zwemt|duikt|"
    r"mannetje|vrouwtje|jongen|eieren|symbio\w*|camoufl\w*|kleur\w*|tanden|slaapt|"
    r"geluid\w*|zingt|springt|steekt|verdedig\w*|vijand\w*|parasiet\w*|slim|intelligent|"
    r"gevaarlijk|mens|mensen|leeftijd|oud|diepte|tentakel\w*|kieuwen|vinnen)\b", re.I)
RE_BAD = re.compile(
    r"(geslacht|familie|onderfamilie|orde|onderorde|klasse|superfamilie|stam|beschreven|"
    r"wetenschappelijke naam|synoniem|ondersoort|IUCN|Rode Lijst|taxon|Linnaeus|soortnaam|"
    r"fylogen|zustergroep|monotypisch|geldig|nomen|Ook wel|Engelse naam|vernoemd|"
    r"Wikipedia|\bzie\b|onderstaande|volgende|hieronder|lijst)", re.I)
ABBR = ["ca.", "o.a.", "bijv.", "bv.", "resp.", "v.Chr.", "n.Chr.", "m.a.w.", "e.d.",
        "enz.", "o.m.", "St.", "Dr.", "nl.", "i.p.v.", "t.o.v.", "z.g.", "zgn.", "km.", "cm."]


def split_sentences(text):
    for a in ABBR:
        text = text.replace(a, a.replace(".", "․"))
    parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-Ý\"'(])", text)
    return [p.replace("․", ".").strip() for p in parts if p.strip()]


def parse_extract(extract):
    """-> (intro-zin, [kandidaatzinnen met score])."""
    section = ""
    sentences = []
    for line in extract.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^=+\s*(.*?)\s*=+$", line)
        if m:
            section = m.group(1)
            continue
        if SKIP_SECTIONS.search(section):
            continue
        for s in split_sentences(line):
            sentences.append(s)
    if not sentences:
        return "", []
    intro = sentences[0]
    cands = []
    for idx, s in enumerate(sentences[1:], 1):
        if not (45 <= len(s) <= 260) or not s[0].isupper() or not s.endswith((".", "!")):
            continue
        if RE_BAD.search(s) or s.count("(") != s.count(")") or ":" in s[-3:]:
            continue
        score = 3 * min(2, len(RE_NUM.findall(s))) + 3 * bool(RE_SUPER.search(s)) + \
            min(3, len(RE_FUN.findall(s)))
        cands.append((score, idx, s))
    return intro, cands


RE_ANAPHOR = re.compile(
    r"^(Ze|Zij|Hij|Het|Dit|Deze|Die|Dat|Daardoor|Hierdoor|Daarom|Daarbij|Daarnaast|Ook|Toch|"
    r"Echter|Hier|Daar|Verder|Bovendien|Beide|Dezelfde|Andere|Zo|Dan|Wel|Dus|In plaats daarvan|"
    r"Hierbij|Daarvan|Hiervan|Dergelijke|Zulke|Eerstgenoemde|Laatstgenoemde)\b(?! (dier|jong|mannetje|vrouwtje|lichaam|ei|nest|gif)\b)")
RE_SIZE = re.compile(r"\b(lang|lengte|zwaar|gewicht|wegen|weegt|groot|breed)\b", re.I)


RE_REFERS_BACK = re.compile(
    r"\b(daarvan|hiervan|daarop|hierop|daarmee|hiermee|dit doel|bovengenoemde|eerder genoemde)\b", re.I)
RE_DUTCH = re.compile(r"\b(de|het|een|en|van|is|zijn|in|met|op)\b", re.I)


def pick_facts(cands, n=3):
    cands = [c for c in cands if not RE_ANAPHOR.match(c[2]) and not RE_REFERS_BACK.search(c[2])
             and RE_DUTCH.search(c[2])]
    best_first = sorted([c for c in cands if c[0] >= 2], key=lambda c: (-c[0], c[1]))
    in_order = sorted(cands, key=lambda c: c[1])  # aanvulling: volgorde van het artikel
    chosen, sizes = [], 0
    for c in best_first + in_order:
        if len(chosen) >= n or c in chosen:
            continue
        is_size = bool(RE_SIZE.search(c[2]) and RE_NUM.search(c[2]))
        if is_size and sizes >= 1:
            continue
        sizes += is_size
        chosen.append(c)
    return [c[2] for c in sorted(chosen, key=lambda c: c[1])]


def clean_name(title):
    name = re.sub(r"\s*\(.*?\)\s*$", "", title).strip()
    return name[0].upper() + name[1:] if name else name


def looks_latin(name, sci):
    name = re.sub(r"\s*\(.*?\)", "", name)
    n = name.lower()
    return n == sci.lower() or n == sci.split()[0].lower() or \
        (len(name.split()) == 2 and name.split()[1].islower() and name.split()[0] == sci.split()[0])


def clean_intro(s):
    s = re.sub(r"\s*\([^()]*\)", "", s)        # haakjes met naam/auteur/jaar weg
    s = re.sub(r"\s+([,.])", r"\1", s)
    return re.sub(r"\s{2,}", " ", s).strip()


# ---------- 3. Afbeeldingen ----------
def slugify(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main():
    want_images = "--no-images" not in sys.argv
    species = all_species()
    print(f"{len(species)} soorten in de lijst")
    wd = wikidata_lookup([s for s, _ in species])
    nlwiki_prefetch(sorted({v["nlTitle"] for v in wd.values() if v["nlTitle"]}))

    animals, seen_titles, dropped = [], set(), []
    for i, (sci, cat) in enumerate(species):
        info = wd.get(sci)
        if not info or not info["nlTitle"]:
            dropped.append((sci, "geen NL-artikel"))
            continue
        page = nlwiki_page(info["nlTitle"])
        title = page["title"] or info["nlTitle"]
        if title in seen_titles:
            continue
        name = clean_name(title)
        if looks_latin(name, sci) and info["nlLabel"] and not looks_latin(info["nlLabel"], sci):
            name = clean_name(info["nlLabel"])
        if looks_latin(name, sci):
            dropped.append((sci, "geen Nederlandse naam"))
            continue
        intro, cands = parse_extract(page["extract"])
        facts = pick_facts(cands)
        image = info["image"]
        img_file = urllib.parse.unquote(image.rsplit("/", 1)[-1]) if image else page["pageimage"]
        if not img_file or img_file.lower().endswith((".svg", ".tif", ".tiff", ".ogg", ".webm")):
            img_file = page["pageimage"] if page["pageimage"] and \
                not page["pageimage"].lower().endswith(".svg") else None
        seen_titles.add(title)
        animals.append({
            "id": slugify(sci), "name": name, "sci": sci, "cat": cat,
            "intro": clean_intro(intro), "facts": facts,
            "wiki": "https://nl.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
            "imgFile": img_file,
        })
        if i % 25 == 0:
            print(f"Wikipedia: {i}/{len(species)}")

    # dubbele Nederlandse namen voorkomen (verwarrend in de quiz)
    by_name = {}
    for a in animals:
        by_name.setdefault(a["name"].lower(), []).append(a)
    animals = [v[0] for v in by_name.values()]

    if "--limit" in sys.argv:  # snel testen op een klein aantal dieren
        animals = animals[:int(sys.argv[sys.argv.index("--limit") + 1])]
    if want_images:
        from media import enrich
        print(f"Foto's en kaarten voor {len(animals)} dieren...")
        animals = enrich(animals)
    for a in animals:
        a.pop("imgFile", None)

    animals.sort(key=lambda a: (a["cat"], a["name"]))
    with open(os.path.join(ROOT, "data.js"), "w", encoding="utf-8") as f:
        f.write("// Gegenereerd door scraper/scrape.py — bronnen: Wikidata, nl.wikipedia.org, "
                "Wikimedia Commons, iNaturalist, GBIF\n")
        f.write("window.OCEAN_ANIMALS = ")
        json.dump(animals, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    with open(os.path.join(HERE, "dropped.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(f"{s}\t{r}" for s, r in dropped))
    cats = {}
    for a in animals:
        cats[a["cat"]] = cats.get(a["cat"], 0) + 1
    print(f"\nKlaar: {len(animals)} dieren, {len(dropped)} afgevallen (zie dropped.txt)")
    for c, n in cats.items():
        print(f"  {c}: {n}")
    print(f"  zonder feitjes: {sum(1 for a in animals if not a['facts'])}")


if __name__ == "__main__":
    main()
