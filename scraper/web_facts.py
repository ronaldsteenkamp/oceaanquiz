"""Zoekt per dier opvallende feiten op betrouwbare sites buiten Wikipedia.

Bronnen: Monterey Bay Aquarium, Oceana, NOAA Fisheries, National Geographic, MBARI.
Per site hooguit ~1 verzoek per seconde; alles wordt gecachet in cache/web/.
Resultaat: cache/web/batch_XX.txt met per dier de beste kandidaatzinnen + bron-URL,
om daar met de hand één echt goed feitje per dier uit te kiezen en te controleren.
"""
import hashlib
import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser

from funfacts_dump import BORING, FUN
from scrape import CACHE, ROOT, cached_json, http_get

OUT = os.path.join(CACHE, "web")
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36"

NATGEO_CLASS = {"Zoogdieren": "mammals", "Zeevogels": "birds", "Reptielen": "reptiles",
                "Haaien & roggen": "fish", "Vissen": "fish"}


def sites_for(a, name):
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower().replace("'", "")).strip("-")
    yield "Monterey Bay Aquarium", f"https://www.montereybayaquarium.org/animals/animals-a-to-z/{slug}"
    yield "Oceana", f"https://oceana.org/marine-life/{slug}/"
    yield "NOAA Fisheries", f"https://www.fisheries.noaa.gov/species/{slug}"
    yield "National Geographic", f"https://www.nationalgeographic.com/animals/{NATGEO_CLASS.get(a['cat'], 'invertebrates')}/facts/{slug}"
    yield "MBARI", f"https://www.mbari.org/animal/{slug}/"


def sci_sites(a):
    yield "Animal Diversity Web", f"https://animaldiversity.org/accounts/{a['sci'].replace(' ', '_')}/"
    if a["cat"] in ("Vissen", "Haaien & roggen"):
        yield "Florida Museum", ("https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/"
                                 + a["sci"].lower().replace(" ", "-") + "/")


class Text(HTMLParser):
    BLOCK = ("p", "li", "h2", "h3", "h4", "dd")
    SKIP = ("script", "style", "nav", "footer", "header", "form", "aside", "button")

    def __init__(self):
        super().__init__()
        self.out, self.cur, self.skip = [], None, 0

    def handle_starttag(self, t, attrs):
        if t in self.SKIP:
            self.skip += 1
        elif t in self.BLOCK and not self.skip:
            self.cur = [t, ""]

    def handle_endtag(self, t):
        if t in self.SKIP and self.skip:
            self.skip -= 1
        elif self.cur and t == self.cur[0]:
            x = re.sub(r"\s+", " ", self.cur[1]).strip()
            if len(x) > 30:
                self.out.append(x)
            self.cur = None

    def handle_data(self, d):
        if self.cur:
            self.cur[1] += d


_locks, _last = {}, {}


def polite_get(site, url):
    lock = _locks.setdefault(site, threading.Lock())
    with lock:
        wait = 1.1 - (time.time() - _last.get(site, 0))
        if wait > 0:
            time.sleep(wait)
        _last[site] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                want = urllib.parse.urlparse(url).path.rstrip("/")
                got = urllib.parse.urlparse(r.geturl()).path.rstrip("/")
                parent = want.rsplit("/", 1)[0]
                # doorverwijzing binnen dezelfde rubriek is prima (Latijnse -> Engelse naam),
                # naar een overzichts- of indelingspagina niet
                if r.status != 200 or got.endswith("/classification") or not got.startswith(parent + "/"):
                    return None
                return r.read().decode("utf-8", "ignore")
        except Exception:
            return None


def page_text(site, url):
    key = os.path.join(OUT, hashlib.md5(url.encode()).hexdigest() + ".json")
    if os.path.exists(key):
        return json.load(open(key, encoding="utf-8"))
    html = polite_get(site, url)
    paras = None
    if html:
        p = Text()
        p.feed(html)
        paras = p.out
    json.dump(paras, open(key, "w", encoding="utf-8"))
    return paras


JUNK = re.compile(r"donat|subscribe|sign up|newsletter|cookie|privacy|adopt|our (store|campaign)|"
                  r"oceana is|aquarium's|visit|tickets|membership|©|all rights|click|learn more|"
                  r"you can help|take action|support", re.I)


def sentences(paras):
    for para in paras:
        if JUNK.search(para):
            continue
        for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\"“])", para):
            s = s.strip()
            if 40 <= len(s) <= 320:
                yield s


def score(s, sci):
    sc = len(FUN.findall(s)) * 2 - len(BORING.findall(s)) * 3
    if re.search(r"\d", s):
        sc += 1
    if re.search(r"!|only|record|world|largest|smallest|fastest|oldest|longest|unlike|surprising", s, re.I):
        sc += 2
    return sc


def common_names(sci_list):
    names = {}
    for i in range(0, len(sci_list), 60):
        batch = sci_list[i:i + 60]
        q = """SELECT ?name ?cn WHERE { VALUES ?name { %s } ?item wdt:P225 ?name .
               ?item wdt:P1843 ?cn . FILTER(LANG(?cn) = "en") }""" % " ".join(json.dumps(n) for n in batch)

        def fetch():
            url = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q)
            return json.loads(http_get(url))["results"]["bindings"]
        for row in cached_json("wdcn_" + hashlib.md5(q.encode()).hexdigest()[:10], fetch):
            names.setdefault(row["name"]["value"], []).append(row["cn"]["value"])
    return names


def main():
    s = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    animals = json.loads(s[s.index("=") + 1:s.index("window.OCEAN_META")].rstrip().rstrip(";"))
    order = {"Vissen": 0, "Overige ongewervelden": 1, "Kreeftachtigen & co": 2, "Weekdieren": 3,
             "Kwallen & koralen": 4, "Stekelhuidigen": 5}
    animals.sort(key=lambda a: (order.get(a["cat"], 9), a["cat"], a["name"]))
    en_titles = json.load(open(os.path.join(CACHE, "fun", "en_titles.json"), encoding="utf-8"))
    cn = common_names([a["sci"] for a in animals])

    def names_for(a):
        out = []
        t = en_titles.get(a["sci"])
        if t and t.lower() != a["sci"].lower():
            out.append(re.sub(r"\s*\(.*\)$", "", t))
        for n in cn.get(a["sci"], []):
            if n.lower() not in {x.lower() for x in out}:
                out.append(n)
        return out[:3] or [a["sci"]]

    def work(a):
        found = []
        for site, url in sci_sites(a):
            paras = page_text(site, url)
            if paras and len(" ".join(paras)) > 400:
                found.append((site, url, paras))
        for name in names_for(a):
            for site, url in sites_for(a, name):
                if any(f[1] == url for f in found):
                    continue
                paras = page_text(site, url)
                if paras and len(" ".join(paras)) > 400:
                    found.append((site, url, paras))
        cands = []
        for site, url, paras in found:
            for sent in dict.fromkeys(sentences(paras)):
                cands.append((score(sent, a["sci"]), site, url, sent))
        cands.sort(key=lambda c: -c[0])
        return a, names_for(a), [(si, u) for si, u, _ in found], cands[:14]

    results = []
    with ThreadPoolExecutor(max_workers=5) as ex:
        for n, r in enumerate(ex.map(work, animals)):
            results.append(r)
            if n % 25 == 0:
                print(f"Web: {n}/{len(animals)}", flush=True)

    hit = sum(1 for r in results if r[2])
    print(f"Dieren met minstens één bronpagina: {hit}/{len(results)}")
    for b in range(0, len(results), 40):
        with open(os.path.join(OUT, f"batch_{b // 40:02d}.txt"), "w", encoding="utf-8") as f:
            for a, names, pages, cands in results[b:b + 40]:
                f.write(f"## {a['id']} | {a['name']} | {a['sci']} | {a['cat']} | EN: {', '.join(names)}\n")
                for fact in a["facts"]:
                    f.write(f"  NU: {fact}\n")
                for si, u in pages:
                    f.write(f"  PAGINA [{si}] {u}\n")
                for i, (sc, si, u, sent) in enumerate(cands, 1):
                    f.write(f"  {i}. ({si}) {sent}\n")
                f.write("\n")


if __name__ == "__main__":
    main()
