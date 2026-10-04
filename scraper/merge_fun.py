"""Voegt de herschreven 'leuke feitjes' (fun/batch_*.json) samen in facts_curated.json.

Elk feitje is met de hand herschreven uit de Nederlandse en/of Engelse Wikipedia en
gecontroleerd tegen die bron. De bron(nen) worden meegeschreven zodat de app ze kan tonen.
"""
import glob
import json
import os
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def main():
    curated_path = os.path.join(HERE, "facts_curated.json")
    with open(curated_path, encoding="utf-8") as f:
        curated = json.load(f)
    with open(os.path.join(HERE, "cache", "fun", "en_titles.json"), encoding="utf-8") as f:
        en_titles = json.load(f)
    s = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    animals = json.loads(s[s.index("=") + 1:s.index("window.OCEAN_META")].rstrip().rstrip(";"))
    sci_by_id = {a["id"]: a["sci"] for a in animals}
    wiki_by_id = {a["id"]: a["wiki"] for a in animals}

    fun = {}
    for path in sorted(glob.glob(os.path.join(HERE, "fun", "batch_*.json"))):
        with open(path, encoding="utf-8") as f:
            fun.update(json.load(f))

    for aid, entry in fun.items():
        c = curated.setdefault(aid, {})
        c["facts"] = entry["facts"]
        c["src"] = entry["src"]
        en = en_titles.get(sci_by_id.get(aid, ""))
        if "en" in entry["src"] and en:
            c["wikiEn"] = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(en.replace(" ", "_"))
        else:
            c.pop("wikiEn", None)

    # Eén uitgelicht topfeitje per dier, met eigen bron (vaak buiten Wikipedia)
    for top_path in sorted(glob.glob(os.path.join(HERE, "fun", "top_*.json"))):
        with open(top_path, encoding="utf-8") as f:
            for aid, top in json.load(f).items():
                c = curated.setdefault(aid, {})
                # korte notatie: "en"/"nl" = het Wikipedia-artikel van dit dier
                if top["url"] == "en":
                    en = c.get("wikiEn")
                    if not en and en_titles.get(sci_by_id[aid]):
                        en = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(en_titles[sci_by_id[aid]].replace(" ", "_"))
                    top = dict(top, url=en, by="Engelse Wikipedia")
                elif top["url"] == "nl":
                    top = dict(top, url=wiki_by_id[aid], by="Wikipedia")
                c["top"] = top

    with open(curated_path, "w", encoding="utf-8") as f:
        json.dump(curated, f, ensure_ascii=False, indent=1)
    print(f"{len(fun)} dieren bijgewerkt, {sum('wikiEn' in c for c in curated.values())} met Engelse bron, "
          f"{sum('top' in c for c in curated.values())} met topfeitje")


if __name__ == "__main__":
    main()
