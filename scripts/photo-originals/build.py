#!/usr/bin/env python3
"""Rebuild the high-resolution AVIF versions of the site's stock photos from their originals.

Why: until Nov 2026 every photo on the site was a 1000-1600 px copy, soft on Retina screens.
Each entry in manifest.json names the free-licence original (Pexels / Unsplash) that was
pixel-verified against the file the site already used, and the variants to cut from it.
The existing .webp files stay as the <img> fallback; this script only adds .avif files.

Variants are centre crops (the slots use object-fit: cover with the default centred
object-position), so a crop at the slot's aspect ratio shows exactly what the browser
showed before, just from a sharper source.

Usage (from any directory):
    python3 scripts/photo-originals/build.py            # build every entry
    python3 scripts/photo-originals/build.py ecco-about-hero   # build one entry
Originals are cached in ~/.cache/ecco-photo-originals (not in the repo).
Run with a Python that has Pillow with AVIF support (python3 -c "from PIL import features; print(features.check('avif'))").
"""
import json
import os
import sys
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.expanduser('~/.cache/ecco-photo-originals')
OUT_DIR = os.path.join(ROOT, 'images', 'stock')


def fetch(entry):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, entry['cache_name'])
    if not os.path.exists(path):
        req = urllib.request.Request(entry['download'], headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'image/jpeg'})
        with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
            f.write(r.read())
    im = Image.open(path).convert('RGB')
    want = tuple(entry['original'])
    if im.size != want:
        raise SystemExit(f"{entry['id']}: original is {im.size}, manifest says {want}")
    return im


def centre_crop(im, aspect):
    if not aspect:
        return im
    w, h = im.size
    if w / h > aspect:          # too wide: trim the sides
        nw = round(h * aspect)
        x0 = (w - nw) // 2
        return im.crop((x0, 0, x0 + nw, h))
    nh = round(w / aspect)      # too tall: trim top and bottom
    y0 = (h - nh) // 2
    return im.crop((0, y0, w, y0 + nh))


def match_site_colours(im, site_file):
    """Some site files were colour-graded copies (e.g. warmer). Map each RGB channel of the original
    to the site file's mean and spread so the sharper version looks the same as before."""
    from PIL import ImageStat
    site = Image.open(os.path.join(ROOT, site_file)).convert('RGB')
    small = im.resize(site.size, Image.LANCZOS)
    s_site, s_orig = ImageStat.Stat(site), ImageStat.Stat(small)
    bands = []
    for ch, (m_s, sd_s, m_o, sd_o) in enumerate(zip(s_site.mean, s_site.stddev, s_orig.mean, s_orig.stddev)):
        k = sd_s / sd_o if sd_o else 1.0
        lut = [max(0, min(255, round((v - m_o) * k + m_s))) for v in range(256)]
        bands.append(im.getchannel(ch).point(lut))
    return Image.merge('RGB', bands)


def build(entry):
    im = fetch(entry)
    if entry.get('match_site_colours'):
        im = match_site_colours(im, entry['site_file'])
    made = []
    for v in entry['variants']:
        crop = centre_crop(im, v.get('aspect'))
        for w in v['widths']:
            if w > crop.size[0]:
                raise SystemExit(f"{entry['id']}: {w} px is wider than the crop ({crop.size[0]} px)")
            h = round(w * crop.size[1] / crop.size[0])
            out = os.path.join(OUT_DIR, f"{entry['id']}-{v['suffix']}{w}.avif")
            crop.resize((w, h), Image.LANCZOS).save(out, 'AVIF', quality=v.get('quality', entry.get('quality', 45)), speed=6)
            made.append((os.path.relpath(out, ROOT), w, h, os.path.getsize(out) // 1024))
    return made


def main():
    with open(os.path.join(HERE, 'manifest.json'), encoding='utf-8') as f:
        manifest = json.load(f)
    only = set(sys.argv[1:])
    for entry in manifest['photos']:
        if only and entry['id'] not in only:
            continue
        for rel, w, h, kb in build(entry):
            print(f'{rel}  {w}x{h}  {kb} KB')


if __name__ == '__main__':
    main()
