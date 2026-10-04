"""Haalt Engelse Wikipedia-artikelen op en zet per dier de 'leukste' zinnen klaar om fun facts van te maken.

Resultaat: cache/fun/batch_XX.txt  (per dier: titel, huidige feitjes, top-12 Engelse kandidaatzinnen)
"""
import hashlib
import json
import os
import re
import urllib.parse

from scrape import CACHE, ROOT, cache_path, cached_json, http_get, http_post, split_sentences, wikitext_to_plain

OUT = os.path.join(CACHE, "fun")
os.makedirs(OUT, exist_ok=True)

SPARQL = """
SELECT ?name ?enTitle WHERE {
  VALUES ?name { %s }
  ?item wdt:P225 ?name .
  ?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle .
}"""

FUN = re.compile(
    r"\b(largest|smallest|fastest|slowest|longest|oldest|deepest|heaviest|loudest|only|unique|record|"
    r"unlike|despite|surprising|unusual|remarkabl\w*|famous|known as|nicknamed|named after|myth|legend|"
    r"can |able to|capable|mimic\w*|glow\w*|biolumin\w*|venom\w*|poison\w*|toxic|deadl\w*|"
    r"change sex|sex change|hermaphrodit\w*|cannibal\w*|play\w*|intelligen\w*|tool|sing\w*|song|"
    r"sleep\w*|hold (its|their) breath|dive\w*|jump\w*|leap\w*|breach\w*|migrat\w*|travel\w*|"
    r"live for|lifespan|years old|teeth|eyes?|heart|brain|blood|colou?r|camoufl\w*|disguis\w*|"
    r"symbio\w*|parasit\w*|attack\w*|hunt\w*|trap\w*|lure|stun|electric\w*|sound|click\w*|"
    r"cooperat\w*|friend|human|people|culture|ancient|fossil|dinosaur)", re.I)
BORING = re.compile(
    r"(genus|family|subfamily|order |taxonom|phylogen|clade|synonym|described by|binomial|holotype|"
    r"IUCN|Red List|conservation status|CITES|population trend|fishery statistics|tonnes|cladistic|"
    r"morpholog|meristic|dorsal fin rays|vertebrae|chromosome|mitochondrial|specimens? (was|were) collected)", re.I)
SKIP_SECTIONS = re.compile(r"taxonomy|systematics|etymology|references|external links|further reading|"
                           r"see also|notes|bibliography|gallery|sources|description of", re.I)
NUM = re.compile(r"\d")


def en_titles(names):
    out = {}
    for i in range(0, len(names), 60):
        batch = names[i:i + 60]
        values = " ".join(json.dumps(n) for n in batch)

        def fetch():
            url = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(SPARQL % values)
            return json.loads(http_get(url))["results"]["bindings"]
        for row in cached_json("wden_" + hashlib.md5(values.encode()).hexdigest()[:10], fetch):
            out.setdefault(row["name"]["value"], row["enTitle"]["value"])
    return out


def en_pages(titles):
    todo = [t for t in titles if not os.path.exists(cache_path("en_" + t))]
    for i in range(0, len(todo), 50):
        batch = todo[i:i + 50]
        params = {"action": "query", "format": "json", "formatversion": "2", "redirects": "1",
                  "prop": "revisions", "rvprop": "content", "rvslots": "main", "titles": "|".join(batch)}
        q = json.loads(http_post("https://en.wikipedia.org/w/api.php", urllib.parse.urlencode(params).encode()))["query"]
        alias = {r["from"]: r["to"] for k in ("normalized", "redirects") for r in q.get(k, [])}
        pages = {p["title"]: p for p in q["pages"]}
        for t in batch:
            target = t
            while target in alias:
                target = alias[target]
            p = pages.get(target)
            if not p or "revisions" not in p:
                continue
            with open(cache_path("en_" + t), "w", encoding="utf-8") as f:
                json.dump({"title": p["title"], "text": wikitext_to_plain(p["revisions"][0]["slots"]["main"]["content"])},
                          f, ensure_ascii=False)
        print(f"Engelse artikelen: {min(i + 50, len(todo))}/{len(todo)}", flush=True)


def fun_sentences(text, n=12):
    section, scored = "", []
    for line in text.split("\n"):
        m = re.match(r"^=+\s*(.*?)\s*=+$", line.strip())
        if m:
            section = m.group(1)
            continue
        if SKIP_SECTIONS.search(section):
            continue
        for s in split_sentences(line.strip()):
            if not (50 <= len(s) <= 300) or BORING.search(s) or not s[0].isupper():
                continue
            score = 2 * len(FUN.findall(s)) + (1 if NUM.search(s) else 0)
            if score >= 2:
                scored.append((score, len(scored), s))
    best = sorted(scored, key=lambda x: -x[0])[:n]
    return [s for _, _, s in sorted(best, key=lambda x: x[1])]


def main():
    s = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    animals = json.loads(s[s.index("=") + 1:s.index("window.OCEAN_META")].rstrip().rstrip(";"))
    order = {"Zoogdieren": 0, "Haaien & roggen": 1, "Reptielen": 2, "Zeevogels": 3}
    animals.sort(key=lambda a: (order.get(a["cat"], 9), a["cat"], a["name"]))
    titles = en_titles([a["sci"] for a in animals])
    en_pages(sorted(set(titles.values())))
    lines, batch_no, count = [], 0, 0
    for a in animals:
        t = titles.get(a["sci"])
        page = json.load(open(cache_path("en_" + t), encoding="utf-8")) if t and os.path.exists(cache_path("en_" + t)) else None
        cands = fun_sentences(page["text"]) if page else []
        lines.append(f"## {a['id']} | {a['name']} | {a['sci']} | {a['cat']} | EN: {page['title'] if page else '-'}")
        for f in a["facts"]:
            lines.append(f"  NL: {f}")
        for i, c in enumerate(cands, 1):
            lines.append(f"  {i}. {c}")
        lines.append("")
        count += 1
        if count == 40:
            open(os.path.join(OUT, f"batch_{batch_no:02d}.txt"), "w", encoding="utf-8").write("\n".join(lines))
            lines, count, batch_no = [], 0, batch_no + 1
    if lines:
        open(os.path.join(OUT, f"batch_{batch_no:02d}.txt"), "w", encoding="utf-8").write("\n".join(lines))
        batch_no += 1
    with open(os.path.join(OUT, "en_titles.json"), "w", encoding="utf-8") as f:
        json.dump(titles, f, ensure_ascii=False)
    print(f"{len(animals)} dieren, {sum(1 for a in animals if titles.get(a['sci']))} met Engels artikel, {batch_no} batches")


if __name__ == "__main__":
    main()
