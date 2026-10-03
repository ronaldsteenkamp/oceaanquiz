"""Maakt de app-iconen (PWA) in ../icons/ met hetzelfde golf-logo als in de app."""
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")
os.makedirs(OUT, exist_ok=True)
TOP, BOTTOM = (41, 163, 224), (11, 79, 143)


def gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
    return img


def wave(draw, size, scale, alpha=255):
    """Twee golflijnen, geschaald binnen het midden van het icoon."""
    def pt(x, y):  # coördinaten in een 32x32-ontwerp
        off = size * (1 - scale) / 2
        return (off + x / 32 * size * scale, off + y / 32 * size * scale)

    def curve(points, width, a):
        line = []
        for (p0, p1, p2) in points:
            for i in range(21):
                t = i / 20
                x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
                y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
                line.append(pt(x, y))
        draw.line(line, fill=(255, 255, 255, a), width=round(width / 32 * size * scale), joint="curve")
        r = width / 64 * size * scale
        for p in (line[0], line[-1]):
            draw.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), fill=(255, 255, 255, a))

    curve([((6, 19), (10.5, 13), (15, 19)), ((15, 19), (19.5, 25), (26, 19))], 2.6, alpha)
    curve([((10, 13), (14, 7.5), (19, 11))], 2.6, round(alpha * .7))


def make(size, maskable=False, rounded=True):
    big = size * 4  # supersampling voor gladde randen
    base = gradient(big).convert("RGBA")
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    wave(ImageDraw.Draw(layer), big, 0.62 if maskable else 1.0)
    base.alpha_composite(layer)
    if rounded and not maskable:
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.22, fill=255)
        base.putalpha(mask)
    return base.resize((size, size), Image.LANCZOS)


make(192).save(os.path.join(OUT, "icon-192.png"))
make(512).save(os.path.join(OUT, "icon-512.png"))
make(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))
make(180, rounded=False, maskable=True).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))
print("iconen klaar")
