"""Overzichtsvellen van de gekozen foto's per dier (om bijv. foto's met meerdere dieren op te sporen)."""
import json, os
from PIL import Image, ImageDraw
from candidates import font
from scrape import ROOT, CACHE

OUT = os.path.join(CACHE, "review"); os.makedirs(OUT, exist_ok=True)
s = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
animals = json.loads(s[s.index("=") + 1:s.index("window.OCEAN_META")].rstrip().rstrip(";"))
order = {"Zoogdieren": 0, "Reptielen": 1, "Haaien & roggen": 2, "Zeevogels": 3}
animals.sort(key=lambda a: (order.get(a["cat"], 9), a["cat"], a["name"]))
TW, TH, PER = 300, 200, 8
f = font(17)
for n in range(0, len(animals), PER):
    rows = animals[n:n + PER]
    sheet = Image.new("RGB", (3 * TW, len(rows) * (TH + 30)), "white"); d = ImageDraw.Draw(sheet)
    for r, a in enumerate(rows):
        y = r * (TH + 30)
        d.rectangle((0, y, 3 * TW, y + 28), fill=(20, 40, 60))
        d.text((6, y + 4), f"{n + r}. {a['id']}  (kandidaten: sheet_{(n + r) // 2:03d})", fill="white", font=f)
        for i, p in enumerate(a["photos"][:3]):
            im = Image.open(os.path.join(ROOT, p["img"])).convert("RGB"); im.thumbnail((TW - 6, TH - 6))
            sheet.paste(im, (i * TW + (TW - im.width) // 2, y + 30 + (TH - im.height) // 2))
            d.rectangle((i * TW + 3, y + 33, i * TW + 30, y + 58), fill=(255, 210, 0)); d.text((i * TW + 10, y + 35), str(i + 1), fill="black", font=f)
    sheet.save(os.path.join(OUT, f"review_{n // PER:02d}.jpg"), "JPEG", quality=80)
print("klaar", (len(animals) + PER - 1) // PER)
